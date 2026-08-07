import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zen-50 dark:bg-zen-950 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-zen-200 dark:text-zen-800">404</p>
        <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100 mt-4">Страница не найдена</h1>
        <p className="text-zen-500 mt-2 text-sm">Запрошенная страница не существует.</p>
        <Link
          href="/dashboard"
          className="inline-block mt-6 py-3 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium text-sm transition-all"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
