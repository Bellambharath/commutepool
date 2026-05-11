namespace CommutePool.Shared.Pagination;

public sealed record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Total,
    int Page,
    int PageSize)
{
    public bool HasMore => Page * PageSize < Total;
}
