const StatCard = ({ title, value, icon: Icon, color = 'primary', onClick }) => {
  const colorClasses = {
    primary: 'bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
    yellow: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    purple: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
  };

  return (
    <div 
      onClick={onClick}
      className={`card hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:translate-y-[-2px] duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">{title}</p>
          <p className="text-3xl font-extrabold mt-2 tracking-tight text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null) ? (
            <Icon className="w-6 h-6" />
          ) : (
            <span className="text-2xl">{Icon}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
