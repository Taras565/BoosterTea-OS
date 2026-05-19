const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// We will do simple string replacements for the static texts.

const replacements = [
  // Onboarding
  ['BoosterTea OS Ініціалізація', "{t('initSystem')}"],
  ['Біометрія', "Bio"], // Hardcoded for now, or just leave it
  ["Ім'я (Псевдонім)", "{t('enterName')}"],
  ['placeholder="Neo..."', 'placeholder={t("namePlaceholder")}'],
  ['Стать (Гормональний фон)', "{t('gender')}"],
  ['>Чоловіча<', '>{t("male")}<'],
  ['>Жіноча<', '>{t("female")}<'],
  ['>Вага (кг)<', '>{t("weightTitle")}<'],
  ['>Дата народження<', '>{t("birthDate")}<'],
  ['Твій основний режим:', "{t('modeSelect')}"],
  ['Смакова карта', "{t('tasteMap')}"],
  ['Кисле', "{t('acid')}"],
  ['Гірке', "{t('bitter')}"],
  ['Солодке', "{t('sweet')}"],
  ['Мінімум', "{t('min')}"],
  ['Баланс', "{t('bal')}"],
  ['Максимум', "{t('max')}"],
  ["'Створити Профіль' : 'Далі'", "t('btnCreateProfile') : t('btnNext')"],

  // CheckIn
  ['>Статус<', '>{t("todayState")}<'],
  ['>Скинути<', '>{t("reset")}<'],
  ['>Активність<', '>{t("activity")}<'],
  ['>Навантаження ЦНС<', '>{t("cnsLoad")}<'],
  ['>Енергія тіла<', '>{t("energyLvl")}<'],
  ['>Ментальний стан<', '>{t("mentalLvl")}<'],
  ['>Чи вживали ви сьогодні каву/енергетики?<', '>{t("caffeine")}<'],
  ['>Так<', '>{t("yes")}<'],
  ['>Ні<', '>{t("no")}<'],
  ['>Формат напою<', '>{t("format")}<'],
  ['>Лонг (Баланс)<', '>{t("formatLong")}<'],
  ['>Шот (Миттєва Дія)<', '>{t("formatShot")}<'],
  ['>Біо-буст<', '>{t("btnBoost")}<'],

  // Result
  ['>Аналіз Системи<', '>{t("sysAnalysis")}<'],
  ['>Формула Змішування<', '>{t("mixFormula")}<'],
  ['>Реагент<', '>{t("reagent")}<'],
  ['>Температура<', '>{t("temp")}<'],
  ['>Охолодження<', '>{t("cooling")}<'],
  ['>Без льоду<', '>{t("noIce")}<'],
  ['>Рішення Бармена<', '>{t("barmen")}<'],
  ['>Поділитися<', '>{t("btnShare")}<'],
  ['>Заварив!<', '>{t("btnBrewed")}<'],
];

// For the scales
content = content.replace(/label:\s*'Спокій'/g, "label: t('cns1')");
content = content.replace(/label:\s*'Баланс'/g, "label: t('cns2')"); // Will also hit tastes, wait
content = content.replace(/label:\s*'Напруга'/g, "label: t('cns3')");
content = content.replace(/label:\s*'Стрес'/g, "label: t('cns4')");

content = content.replace(/label:\s*'Спад'/g, "label: t('en1')");
content = content.replace(/label:\s*'Норма'/g, "label: t('en2')");
content = content.replace(/label:\s*'Заряд'/g, "label: t('en3')");
content = content.replace(/label:\s*'Пік'/g, "label: t('en4')");

content = content.replace(/label:\s*'Туман'/g, "label: t('mn1')");
content = content.replace(/label:\s*'Фокус'/g, "label: t('mn3')");
content = content.replace(/label:\s*'Лазер'/g, "label: t('mn4')");

content = content.replace(/label:'Кисле'/g, "label: t('acid')");
content = content.replace(/label:'Гірке'/g, "label: t('bitter')");
content = content.replace(/label:'Солодке'/g, "label: t('sweet')");

// Also add lang to props and use getTranslation
// I will just let the manual replace handle the top level logic.

fs.writeFileSync('src/App_updated.tsx', content);
