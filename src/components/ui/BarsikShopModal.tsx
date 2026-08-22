'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Shirt, Sparkles, CheckCircle2, Lock, Coins, Flame, Crown, Shield } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { triggerFlyingCoins, triggerHaptic } from '@/lib/coinAnimation';
import {
  SHOP_ITEMS,
  ShopItem,
  UserShopData,
  getUserShopData,
  buyShopItem,
  equipShopItem,
} from '@/lib/barsikShopStore';

interface BarsikShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: (data: UserShopData) => void;
}

export const BarsikShopModal: React.FC<BarsikShopModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'SHOP' | 'WARDROBE'>('SHOP');
  const [shopData, setShopData] = useState<UserShopData>(getUserShopData());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getUserShopData();
      setShopData(current);
      setFeedbackMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const equippedItem = SHOP_ITEMS.find((i) => i.id === shopData.equippedItemId);

  const handleBuy = (e: React.MouseEvent, item: ShopItem) => {
    soundFx.playClick();
    triggerHaptic(30);

    const result = buyShopItem(item.id);
    if (result.success) {
      soundFx.playCoin();
      triggerFlyingCoins(e.clientX, e.clientY, true);
      setShopData(result.updatedData);
      onDataChanged?.(result.updatedData);
      setFeedbackMsg(`🎉 Куплено и надето: ${item.name}`);
    } else {
      setFeedbackMsg(`⚠️ ${result.message}`);
    }
  };

  const handleEquip = (itemId: string | null) => {
    soundFx.playClick();
    triggerHaptic(20);
    const updated = equipShopItem(itemId);
    setShopData(updated);
    onDataChanged?.(updated);
    setFeedbackMsg(itemId ? '👕 Предмет надет!' : '👕 Предмет снят!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#160B29] via-[#0E061E] to-[#080312] border border-purple-500/40 p-6 shadow-2xl text-white space-y-5 overflow-hidden">

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-extrabold shadow-lg">
              <ShoppingBag size={22} className="animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Гардероб & Магазин Барсика</h3>
              <p className="text-[11px] text-purple-300">Скины, Аксессуары и Неоновые Ауры</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-xs shadow-md">
              <Coins size={14} className="text-amber-400" />
              <span>{shopData.zenCoins.toLocaleString('ru-RU')} 🪙</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Live Mascot Avatar Preview Box */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-4 relative z-10 overflow-hidden">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400/60 bg-black/80 flex-shrink-0 shadow-xl">
            {equippedItem?.auraClass && (
              <div className={`absolute inset-0 rounded-2xl animate-pulse ${equippedItem.auraClass}`} />
            )}
            <img
              src={equippedItem?.image || '/images/mascot_happy_hoodie.png'}
              alt="Барсик"
              className="w-full h-full object-cover"
            />
            {equippedItem && (
              <span className="absolute bottom-0.5 right-0.5 text-xs drop-shadow">
                {equippedItem.icon}
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Текущий Образ Барсика</span>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              <span>{equippedItem ? equippedItem.name : 'Базовый Стиль 7.'}</span>
            </h4>
            <p className="text-[11px] text-purple-300 font-medium">
              {equippedItem ? equippedItem.description : 'Купите эксклюзивный скин в магазине за ZenCoins!'}
            </p>
          </div>
        </div>

        {/* Status Feedback Banner */}
        {feedbackMsg && (
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-xs font-bold text-center text-purple-200 animate-in fade-in relative z-10">
            {feedbackMsg}
          </div>
        )}

        {/* 2 Tabs: 🛍️ Магазин vs 👕 Мой Гардероб */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/50 border border-white/10 relative z-10">
          <button
            onClick={() => { soundFx.playClick(); setActiveTab('SHOP'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'SHOP'
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag size={14} />
            <span>Магазин Скинов</span>
          </button>

          <button
            onClick={() => { soundFx.playClick(); setActiveTab('WARDROBE'); }}
            className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'WARDROBE'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shirt size={14} />
            <span>Мой Гардероб ({shopData.unlockedItemIds.length})</span>
          </button>
        </div>

        {/* TAB 1: SHOP ITEMS */}
        {activeTab === 'SHOP' && (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 relative z-10">
            {SHOP_ITEMS.map((item) => {
              const isUnlocked = shopData.unlockedItemIds.includes(item.id);
              const isEquipped = shopData.equippedItemId === item.id;
              const canAfford = shopData.zenCoins >= item.priceCoins;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isEquipped
                      ? 'bg-amber-500/20 border-amber-400/60 shadow-md'
                      : isUnlocked
                      ? 'bg-purple-950/40 border-purple-500/30'
                      : 'bg-black/40 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl flex-shrink-0">
                      {item.icon}
                    </div>

                    <div>
                      <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {isUnlocked && <CheckCircle2 size={13} className="text-emerald-400" />}
                      </h5>
                      <p className="text-[10px] text-slate-400 font-medium">{item.description}</p>
                    </div>
                  </div>

                  <div>
                    {isUnlocked ? (
                      <button
                        onClick={() => handleEquip(isEquipped ? null : item.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                          isEquipped
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isEquipped ? 'Надето ✨' : 'Надеть'}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleBuy(e, item)}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all active:scale-95 ${
                          canAfford
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:brightness-110 shadow-md'
                            : 'bg-white/5 text-slate-500 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <Coins size={12} />
                        <span>{item.priceCoins} 🪙</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: MY WARDROBE */}
        {activeTab === 'WARDROBE' && (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 relative z-10">
            {shopData.unlockedItemIds.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <Lock size={24} className="mx-auto text-slate-500" />
                <p>У вас пока нет купленных предметов.</p>
                <p className="text-[11px] text-purple-300">Перейдите в магазин и купите первый скин за ZenCoins!</p>
              </div>
            ) : (
              SHOP_ITEMS.filter((i) => shopData.unlockedItemIds.includes(i.id)).map((item) => {
                const isEquipped = shopData.equippedItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isEquipped ? 'bg-amber-500/20 border-amber-400/60 shadow-md' : 'bg-black/40 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl flex-shrink-0">
                        {item.icon}
                      </div>

                      <div>
                        <h5 className="text-xs font-black text-white">{item.name}</h5>
                        <p className="text-[10px] text-slate-400">{item.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEquip(isEquipped ? null : item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                        isEquipped ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isEquipped ? 'Снять' : 'Надеть'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
