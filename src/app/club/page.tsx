import { Metadata } from 'next';
import { ClubClient } from './ClubClient';

export const metadata: Metadata = {
  title: 'ZenRI Club — Сообщество',
  description: 'Закрытое сообщество пользователей ZenRI с анонимной лентой лайфхаков и общим чатом.',
};

export default function ClubPage() {
  return <ClubClient />;
}
