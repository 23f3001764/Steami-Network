export const formatShortUserName = (name?: string | null) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'User';
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
};

export const getInitials = (name?: string | null) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';

  return parts.map((word) => word[0]).join('').toUpperCase().slice(0, 2);
};
