using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

// Navigation fix: add Company navigation to UserCompanyMembershipEntity
public sealed partial class UserCompanyMembershipEntityExtensions { }

// Patch: extend UserCompanyMembershipEntity with navigation (EF will pick this up)
// We add a partial class in same namespace to add navigation property
