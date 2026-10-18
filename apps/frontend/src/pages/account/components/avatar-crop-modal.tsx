import { useEffect, useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
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
    <Modal
      title={t("account.cropAvatar")}
      description={t("account.cropAvatarDescription")}
      onClose={onClose}
    >
      <div className="avatar-crop">
        <div className="avatar-crop__area">
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
        <div className="avatar-crop__controls">
          <label className="field-label avatar-crop__zoom">
            <span>{t("account.zoom")}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
          </label>
          <div className="avatar-crop__preview">
            <span>{t("account.preview")}</span>
            <Avatar initials="" src={result?.url} size="lg" />
          </div>
        </div>
        <div className="modal-form__actions">
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
        </div>
      </div>
    </Modal>
  );
}
