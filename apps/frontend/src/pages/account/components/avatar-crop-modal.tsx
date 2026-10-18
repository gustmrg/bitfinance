import { useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/base/avatar";
import { Button } from "@/components/base/button";
import { Dialog, DialogActions } from "@/components/base/dialog";
import { getCroppedAvatar } from "@/lib/crop-image";

export function AvatarCropModal({
  src,
  pending,
  onConfirm,
  onClose,
}: {
  src: string;
  pending: boolean;
  onConfirm: (file: File) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const request = useRef(0);

  useEffect(
    () => () => {
      if (result) URL.revokeObjectURL(result.url);
    },
    [result],
  );

  const updatePreview = async (_: Area, areaPixels: Area) => {
    const current = ++request.current;
    const blob = await getCroppedAvatar(src, areaPixels);
    if (current !== request.current) return;
    setResult({ blob, url: URL.createObjectURL(blob) });
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t("account.cropAvatar")}
      description={t("account.cropAvatarDescription")}
    >
      <div className="grid gap-4">
        <div className="relative aspect-square max-h-[55vh] w-full overflow-hidden rounded-control bg-ink">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(area, areaPixels) => void updatePreview(area, areaPixels)}
          />
        </div>
        <div className="flex items-end gap-4">
          <label className="grid flex-1 gap-1.5 text-[13px] font-bold">
            <span>{t("account.zoom")}</span>
            <input
              className="w-full accent-brand"
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <div className="grid justify-items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
            <span>{t("account.preview")}</span>
            <Avatar name="" src={result?.url} size="md" className="size-16" />
          </div>
        </div>
        <DialogActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            disabled={!result || pending}
            onClick={() =>
              result && onConfirm(new File([result.blob], "avatar.jpg", { type: "image/jpeg" }))
            }
          >
            {t("account.saveAvatar")}
          </Button>
        </DialogActions>
      </div>
    </Dialog>
  );
}
