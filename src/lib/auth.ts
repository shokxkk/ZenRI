import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AccountType, CurrencyCode } from '@prisma/client';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'zenri_prod_jwt_secret_key_2026_zenri_app';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        try {
          let user = await prisma.user.findUnique({
            where: { email },
          });

          // Auto-seed Demo User if logging in with demo credentials on fresh production database
          if (!user && email === 'demo@zenri.app') {
            const passwordHash = await bcrypt.hash('password123', 10);
            user = await prisma.user.create({
              data: {
                email: 'demo@zenri.app',
                name: 'Шохрух (Демо)',
                passwordHash,
                accounts: {
                  create: [
                    { name: 'Uzcard (Основная)', type: AccountType.UZCARD, currency: CurrencyCode.UZS, initialBalance: 12500000, currentBalance: 12500000, icon: 'uzcard' },
                    { name: 'Humo (Зарплатная)', type: AccountType.HUMO, currency: CurrencyCode.UZS, initialBalance: 8200000, currentBalance: 8200000, icon: 'humo' },
                    { name: 'Visa Gold ($)', type: AccountType.VISA, currency: CurrencyCode.USD, initialBalance: 1500, currentBalance: 1500, icon: 'visa' },
                    { name: 'Наличные (Кошелек)', type: AccountType.CASH, currency: CurrencyCode.UZS, initialBalance: 450000, currentBalance: 450000, icon: 'cash' },
                  ],
                },
              },
            });
          }

          if (!user || !user.passwordHash) {
            return null;
          }

          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatarUrl,
          };
        } catch (err) {
          console.error('Error during authorization:', err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: JWT_SECRET,
});
