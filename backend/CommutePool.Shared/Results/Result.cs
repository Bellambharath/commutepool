namespace CommutePool.Shared.Results;

public sealed class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public ApiError? Error { get; }

    private Result(T value) { IsSuccess = true; Value = value; }
    private Result(ApiError error) { IsSuccess = false; Error = error; }

    public static Result<T> Ok(T value) => new(value);
    public static Result<T> Fail(string code, string message) => new(new ApiError(code, message));
    public static Result<T> Fail(ApiError error) => new(error);
}

public sealed class Result
{
    public bool IsSuccess { get; }
    public ApiError? Error { get; }

    private Result(bool success, ApiError? error = null) { IsSuccess = success; Error = error; }

    public static Result Ok() => new(true);
    public static Result Fail(string code, string message) => new(false, new ApiError(code, message));
}

public sealed record ApiError(string Code, string Message, Dictionary<string, string[]>? Details = null);
