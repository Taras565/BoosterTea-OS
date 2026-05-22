const fs = require('fs');
const path = require('path');

const i18nPath = path.join(__dirname, '..', 'src', 'i18n.ts');
let content = fs.readFileSync(i18nPath, 'utf8');

const newManifestKeys = {
  uk: `    // Welcome Manifest
    wm1Title: "Рідка Операційна Система",
    wm1Sub: "ТВІЙ ПЕРСОНАЛЬНИЙ БІО-АДАПТЕР",
    wm1Desc: "Це перший у світі Health-Tech додаток, який створює персональний біо-коктейль на основі твого стану. Мета — дати тобі фокус, спокій або енергію без відкатів.",
    
    wm2Title: "Нейро-Активні Компоненти",
    wm2Sub: "100% ПРИРОДНА ХІМІЯ",
    wm2Desc: "Ми використовуємо глибокі екстракти чаю (GABA, Пуер, Да Хун Пао), які багаті на L-теанін та катехіни.",
    wm2Fear: "Жодної хімії, жодного цукру чи синтетичного кофеїну. Виключно органіка.",
    
    wm3Title: "Ідеальна Синергія",
    wm3Sub: "ФРУКТОВІ АКТИВАТОРИ",
    wm3Desc: "Алгоритм підбирає не лише чайну базу, але й активатори (соки-фреші). Фруктові кислоти прискорюють всмоктування L-теаніну в кров.",
    wm3Fear: "Ефект відчувається вже за 15 хвилин завдяки правильному pH балансу.",
    
    wm4Title: "Математична Точність",
    wm4Sub: "БЕЗПЕЧНИЙ БІО-ХАКІНГ",
    wm4Desc: "Забудь про тахікардію чи тривожність як від енергетиків. Додаток вираховує дозу з точністю до мілілітра на основі твоєї ваги.",
    wm4Fear: "Захист серця та нервової системи — наш головний пріоритет.",
    
    wm5Title: "Як цим користуватись?",
    wm5Sub: "ЩОДЕННИЙ РИТУАЛ",
    wm5Step1: "1. Забий свій стан",
    wm5Step1D: "Вкажи свій рівень втоми та стресу.",
    wm5Step2: "2. Отримай формулу",
    wm5Step2D: "Алгоритм видасть персональний рецепт.",
    wm5Step3: "3. Пий та дихай",
    wm5Step3D: "Зроби напій і увімкни дихальний тренажер.",
    
    btnNext: "Далі",
    btnStart: "Запустити систему",`,
  en: `    // Welcome Manifest
    wm1Title: "Liquid Operating System",
    wm1Sub: "YOUR PERSONAL BIO-ADAPTER",
    wm1Desc: "The world's first Health-Tech app that creates a personal bio-cocktail based on your state. The goal is to give you focus, calm, or energy with no crashes.",
    
    wm2Title: "Neuro-Active Components",
    wm2Sub: "100% NATURAL CHEMISTRY",
    wm2Desc: "We use deep tea extracts (GABA, Puer, Da Hong Pao) rich in L-theanine and catechins.",
    wm2Fear: "No chemicals, no sugar, no synthetic caffeine. Exclusively organic.",
    
    wm3Title: "Perfect Synergy",
    wm3Sub: "FRUIT ACTIVATORS",
    wm3Desc: "The algorithm selects not only the tea base but also activators (fresh juices). Fruit acids accelerate the absorption of L-theanine into the blood.",
    wm3Fear: "The effect is felt in just 15 minutes thanks to the correct pH balance.",
    
    wm4Title: "Mathematical Precision",
    wm4Sub: "SAFE BIO-HACKING",
    wm4Desc: "Forget about tachycardia or anxiety like from energy drinks. The app calculates the dose with milliliter precision based on your weight.",
    wm4Fear: "Heart and nervous system protection is our top priority.",
    
    wm5Title: "How to use this?",
    wm5Sub: "DAILY RITUAL",
    wm5Step1: "1. Log your state",
    wm5Step1D: "Specify your fatigue and stress levels.",
    wm5Step2: "2. Get the formula",
    wm5Step2D: "The algorithm will give a personalized recipe.",
    wm5Step3: "3. Drink & Breathe",
    wm5Step3D: "Make the drink and turn on the breathwork trainer.",
    
    btnNext: "Next",
    btnStart: "Start System",`,
  ru: `    // Welcome Manifest
    wm1Title: "Жидкая Операционная Система",
    wm1Sub: "ТВОЙ ПЕРСОНАЛЬНЫЙ БИО-АДАПТЕР",
    wm1Desc: "Это первое в мире Health-Tech приложение, создающее персональный био-коктейль на основе твоего состояния. Цель — дать тебе фокус, спокойствие или энергию без откатов.",
    
    wm2Title: "Нейро-Активные Компоненты",
    wm2Sub: "100% ПРИРОДНАЯ ХИМИЯ",
    wm2Desc: "Мы используем глубокие экстракты чая (GABA, Пуэр, Да Хун Пао), богатые L-теанином и катехинами.",
    wm2Fear: "Никакой химии, сахара или синтетического кофеина. Исключительно органика.",
    
    wm3Title: "Идеальная Синергия",
    wm3Sub: "ФРУКТОВЫЕ АКТИВАТОРЫ",
    wm3Desc: "Алгоритм подбирает не только чайную базу, но и активаторы (соки-фреши). Фруктовые кислоты ускоряют всасывание L-теанина в кровь.",
    wm3Fear: "Эффект ощущается уже через 15 минут благодаря правильному pH балансу.",
    
    wm4Title: "Математическая Точность",
    wm4Sub: "БЕЗОПАСНЫЙ БИО-ХАКИНГ",
    wm4Desc: "Забудь про тахикардию или тревожность как от энергетиков. Приложение высчитывает дозу с точностью до миллилитра на основе твоего веса.",
    wm4Fear: "Защита сердца и нервной системы — наш главный приоритет.",
    
    wm5Title: "Как этим пользоваться?",
    wm5Sub: "ЕЖЕДНЕВНЫЙ РИТУАЛ",
    wm5Step1: "1. Забей свое состояние",
    wm5Step1D: "Укажи уровень усталости и стресса.",
    wm5Step2: "2. Получи формулу",
    wm5Step2D: "Алгоритм выдаст персональный рецепт.",
    wm5Step3: "3. Пей и дыши",
    wm5Step3D: "Сделай напиток и включи дыхательный тренажер.",
    
    btnNext: "Далее",
    btnStart: "Запустить систему",`,
  es: `    // Welcome Manifest
    wm1Title: "Sistema Operativo Líquido",
    wm1Sub: "TU BIO-ADAPTADOR PERSONAL",
    wm1Desc: "La primera aplicación Health-Tech que crea un bio-cóctel personal basado en tu estado. El objetivo es darte enfoque, calma o energía sin bajones.",
    
    wm2Title: "Componentes Neuroactivos",
    wm2Sub: "QUÍMICA 100% NATURAL",
    wm2Desc: "Usamos extractos profundos de té (GABA, Puer, Da Hong Pao) ricos en L-teanina y catequinas.",
    wm2Fear: "Sin químicos, sin azúcar, sin cafeína sintética. Exclusivamente orgánico.",
    
    wm3Title: "Sinergia Perfecta",
    wm3Sub: "ACTIVADORES FRUTALES",
    wm3Desc: "El algoritmo selecciona no solo la base del té sino también activadores (jugos frescos). Los ácidos frutales aceleran la absorción de L-teanina.",
    wm3Fear: "El efecto se siente en solo 15 minutos gracias al equilibrio de pH correcto.",
    
    wm4Title: "Precisión Matemática",
    wm4Sub: "BIO-HACKING SEGURO",
    wm4Desc: "Olvídate de la taquicardia o la ansiedad como con las bebidas energéticas. La aplicación calcula la dosis con precisión de mililitros.",
    wm4Fear: "La protección del corazón y el sistema nervioso es nuestra principal prioridad.",
    
    wm5Title: "¿Cómo usar esto?",
    wm5Sub: "RITUAL DIARIO",
    wm5Step1: "1. Registra tu estado",
    wm5Step1D: "Especifica tus niveles de fatiga y estrés.",
    wm5Step2: "2. Obtén la fórmula",
    wm5Step2D: "El algoritmo te dará una receta personalizada.",
    wm5Step3: "3. Bebe y respira",
    wm5Step3D: "Prepara la bebida y enciende el entrenador de respiración.",
    
    btnNext: "Siguiente",
    btnStart: "Iniciar sistema",`
};

const langs = ['uk', 'en', 'ru', 'es'];

for (const lang of langs) {
    const regex = new RegExp('(\\\\b' + lang + ':\\\\s*\\\\{\\\\s*// Welcome Manifest\\\\b)[\\\\s\\\\S]*?(\\\\n\\\\s*// Onboarding\\\\b)');
    content = content.replace(regex, lang + ': {\\n' + newManifestKeys[lang] + '\\n$2');
}

fs.writeFileSync(i18nPath, content);
console.log("Updated i18n keys successfully.");
