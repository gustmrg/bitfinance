using System.Diagnostics.CodeAnalysis;

namespace BitFinance.Business.Results;

public enum ErrorType
{
    NotFound,
    PlanLimitExceeded
}

/// <summary>
/// An expected failure of an operation, as opposed to an exception.
/// </summary>
public sealed record Error(ErrorType Type, string Message)
{
    public static Error NotFound(string message) => new(ErrorType.NotFound, message);

    public static Error PlanLimitExceeded(string message) => new(ErrorType.PlanLimitExceeded, message);
}

/// <summary>
/// The outcome of an operation that returns no value.
/// </summary>
public readonly struct Result
{
    private Result(Error? error) => Error = error;

    public Error? Error { get; }

    [MemberNotNullWhen(false, nameof(Error))]
    public bool IsSuccess => Error is null;

    public static Result Success() => new(null);

    public static implicit operator Result(Error error) => new(error);
}

/// <summary>
/// The outcome of an operation: either its value or the expected error that prevented it.
/// </summary>
public readonly struct Result<T>
{
    private Result(T? value, Error? error)
    {
        Value = value;
        Error = error;
    }

    public T? Value { get; }

    public Error? Error { get; }

    [MemberNotNullWhen(true, nameof(Value))]
    [MemberNotNullWhen(false, nameof(Error))]
    public bool IsSuccess => Error is null;

    public static implicit operator Result<T>(T value) => new(value, null);

    public static implicit operator Result<T>(Error error) => new(default, error);
}
