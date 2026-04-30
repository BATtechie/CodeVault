export const createNotifications = async (
  prisma,
  {
    userIds,
    type,
    title,
    message,
    payload,
  },
) => {
  const dedupedUserIds = [...new Set((userIds || []).filter(Boolean))];

  if (dedupedUserIds.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: dedupedUserIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      payload,
    })),
  });
};
