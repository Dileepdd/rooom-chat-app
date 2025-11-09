export function formatUserName(member, currentUser) {
  if (!member || !currentUser) return "";
  if (member._id === currentUser.id || member._id === currentUser._id)
    return "You";

  const name = `${member.firstname || ""} ${member.lastname || ""}`.trim();
  return name || member.username || member.email;
}
