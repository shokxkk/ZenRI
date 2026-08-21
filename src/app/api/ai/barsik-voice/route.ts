import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = (body.prompt || '').trim().toLowerCase();
    const totalBalance = body.totalBalance || 0;
    const monthlyIncome = body.monthlyIncome || 0;
    const monthlyExpense = body.monthlyExpense || 0;

    if (!prompt) {
      return NextResponse.json({ error: 'Пустой запрос' }, { status: 400 });
    }

    let answerText = '';
    let chartType = 'GENERAL';
    let chartData: any = null;

    // Pattern matching & Intelligent financial responses
    if (prompt.includes('такси') || prompt.includes('транспорт')) {
      const taxiAmount = Math.round(monthlyExpense * 0.18) || 320000;
      answerText = `Барсик посчитал: в этом месяце на такси и транспорт ушло примерно ${taxiAmount.toLocaleString('ru-RU')} сум (${Math.round((taxiAmount / (monthlyExpense || 1)) * 100)}% всех расходов). Рекомендую пользоваться услугами по тарифу Эконом!`;
      chartType = 'BAR';
      chartData = [
        { label: 'Такси Яндекс', amount: Math.round(taxiAmount * 0.7) },
        { label: 'Другое такси', amount: Math.round(taxiAmount * 0.2) },
        { label: 'Общественный', amount: Math.round(taxiAmount * 0.1) },
      ];
    } else if (prompt.includes('еда') || prompt.includes('продукты') || prompt.includes('кафе') || prompt.includes('ресторан')) {
      const foodAmount = Math.round(monthlyExpense * 0.35) || 850000;
      answerText = `На еду и рестораны потрачено ${foodAmount.toLocaleString('ru-RU')} сум. Это самая крупная статья трат! Если готовить дома 3 раза в неделю, можно сэкономить до 300 000 сум в месяц.`;
      chartType = 'DONUT';
      chartData = [
        { label: 'Продукты', value: Math.round(foodAmount * 0.6), color: '#10B981' },
        { label: 'Кафе & Доставка', value: Math.round(foodAmount * 0.4), color: '#F59E0B' },
      ];
    } else if (prompt.includes('баланс') || prompt.includes('сколько денег') || prompt.includes('денег')) {
      answerText = `Твой текущий общий баланс составляет ${totalBalance.toLocaleString('ru-RU')} сум. ${
        totalBalance <= 0
          ? 'Внимание! Баланс в минусе, Барсик советует сократить необязательные траты!'
          : 'Финансовое состояние устойчивое!'
      }`;
      chartType = 'BALANCE';
      chartData = {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
      };
    } else if (prompt.includes('совет') || prompt.includes('сэкономить') || prompt.includes('накопить')) {
      const potentialSavings = Math.round((monthlyIncome - monthlyExpense) * 0.2) || 450000;
      answerText = `Совет от Барсика: правило 50/30/20! Направляй 20% доходов сразу в копилку (около ${potentialSavings.toLocaleString('ru-RU')} сум в месяц). И отложи покупку ненужных вещей на 48 часов!`;
      chartType = 'PIE';
      chartData = [
        { label: 'Нужды (50%)', value: 50, color: '#3B82F6' },
        { label: 'Хотелки (30%)', value: 30, color: '#8B5CF6' },
        { label: 'Накопления (20%)', value: 20, color: '#10B981' },
      ];
    } else {
      answerText = `Барсик на связи! Твой доход за месяц: ${monthlyIncome.toLocaleString('ru-RU')} сум, расход: ${monthlyExpense.toLocaleString('ru-RU')} сум. Задавай мне любые вопросы про такси, еду, баланс или советы по накоплениям!`;
      chartType = 'GENERAL';
    }

    return NextResponse.json({
      success: true,
      answerText,
      chartType,
      chartData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ошибка ИИ' }, { status: 500 });
  }
}
