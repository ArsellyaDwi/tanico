import { prisma } from '@/lib/prisma';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

export async function findUserByEmail(email) {
  if (!email || !prisma) return null;
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    return await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      include: { role: true }
    });
  } catch (error) {
    logger.error('Error in findUserByEmail:', error);
    return null;
  }
}

export async function createUser(data) {
  if (!prisma) return null;
  try {
    const normalizedEmail = String(data.email).trim().toLowerCase();
    let role = await prisma.role.findUnique({ where: { name: data.role || 'CUSTOMER' } });
    if (!role) {
      role = await prisma.role.create({ data: { name: data.role || 'CUSTOMER' } });
    }

    return await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: data.name,
        password: data.password || '',
        phone: data.phone || null,
        address: data.address || null,
        avatar: data.avatar || null,
        provider: data.provider || 'Email',
        status: data.status || 'Aktif',
        roleId: role.id
      },
      include: { role: true }
    });
  } catch (error) {
    logger.error('Error in createUser:', error);
    throw error;
  }
}

export async function updateUserProfile(userId, data) {
  if (!userId || !prisma) return null;
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.avatar !== undefined && { avatar: data.avatar })
      },
      include: { role: true }
    });
  } catch (error) {
    logger.error('Error in updateUserProfile:', error);
    throw error;
  }
}

export async function updateUserPassword(userId, hashedPassword) {
  if (!userId || !prisma) return null;
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  } catch (error) {
    logger.error('Error in updateUserPassword:', error);
    throw error;
  }
}

export async function createPasswordResetToken(email) {
  if (!email || !prisma) return null;
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await prisma.passwordReset.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, token, expiresAt },
      update: { token, expiresAt }
    });

    return token;
  } catch (error) {
    logger.error('Error in createPasswordResetToken:', error);
    return null;
  }
}

export async function verifyPasswordResetToken(email, token) {
  if (!email || !token || !prisma) return false;
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const record = await prisma.passwordReset.findUnique({
      where: { email: normalizedEmail }
    });

    if (!record || record.token !== token) return false;
    if (new Date() > new Date(record.expiresAt)) return false;

    return true;
  } catch (error) {
    logger.error('Error in verifyPasswordResetToken:', error);
    return false;
  }
}

export async function deletePasswordResetToken(email) {
  if (!email || !prisma) return false;
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    await prisma.passwordReset.delete({
      where: { email: normalizedEmail }
    }).catch(() => {});
    return true;
  } catch (error) {
    return false;
  }
}
