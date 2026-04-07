export const formatRoleName = (role: string): string => {
  return role.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};
