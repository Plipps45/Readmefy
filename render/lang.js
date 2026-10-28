// README content in each language. Defaults are written in English and looked up here;
// the same table moves untouched default texts to another language when the user switches.
export const LANGS = { en: "English", es: "Español", pt: "Português", ru: "Русский" };
export const LOCALES = { en: "en-US", es: "es-ES", pt: "pt-BR", ru: "ru-RU" };

export const MONTHS = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec";

// [English, Spanish, Portuguese, Russian]
const ROWS = [
  ["Hi, I'm", "Hola, soy", "Olá, eu sou", "Привет, я"],
  ["Developer who turns coffee into code and design into experiences.", "Desarrollador que convierte café en código y diseño en experiencias.", "Desenvolvedor que transforma café em código e design em experiências.", "Разработчик, который превращает кофе в код, а дизайн — во впечатления."],
  ["Planet Earth", "Planeta Tierra", "Planeta Terra", "Планета Земля"],
  ["New", "Nuevo", "Novo", "Новый"],
  ["your-username", "tu-usuario", "seu-usuario", "ваш-логин"],
  ["Your Name", "Tu Nombre", "Seu Nome", "Ваше имя"],
  ["I build fast web apps", "Construyo apps web rápidas", "Crio apps web rápidos", "Создаю быстрые веб-приложения"],
  ["Open source lover", "Amante del código abierto", "Apaixonado por código aberto", "Люблю open source"],
  ["Always learning something new", "Siempre aprendiendo algo nuevo", "Sempre aprendendo algo novo", "Всегда изучаю что-то новое"],
  ["New phrase", "Nueva frase", "Nova frase", "Новая фраза"],
  ["About me", "Sobre mí", "Sobre mim", "Обо мне"],
  ["I work on web projects and developer tools", "Trabajo en proyectos web y herramientas de desarrollo", "Trabalho em projetos web e ferramentas de desenvolvimento", "Работаю над веб-проектами и инструментами для разработчиков"],
  ["Learning Rust and systems design", "Aprendiendo Rust y diseño de sistemas", "Aprendendo Rust e design de sistemas", "Изучаю Rust и проектирование систем"],
  ["Open to collaborating on open source projects", "Abierto a colaborar en proyectos open source", "Aberto a colaborar em projetos open source", "Открыт к сотрудничеству в open source проектах"],
  ["Fun fact: I write better code late at night", "Dato curioso: escribo mejor código de madrugada", "Curiosidade: escrevo código melhor de madrugada", "Забавный факт: ночью я пишу код лучше"],
  ["Something about you", "Algo sobre ti", "Algo sobre você", "Что-нибудь о себе"],
  ["Tech stack", "Tecnologías", "Tecnologias", "Технологии"],
  ["Languages", "Lenguajes", "Linguagens", "Языки"],
  ["Frameworks", "Frameworks", "Frameworks", "Фреймворки"],
  ["Tools", "Herramientas", "Ferramentas", "Инструменты"],
  ["New group", "Nuevo grupo", "Novo grupo", "Новая группа"],
  ["GitHub stats", "Estadísticas de GitHub", "Estatísticas do GitHub", "Статистика GitHub"],
  ["Stars", "Estrellas", "Estrelas", "Звёзды"],
  ["Contributions (year)", "Contribuciones (año)", "Contribuições (ano)", "Вклад (за год)"],
  ["Commits (year)", "Commits (año)", "Commits (ano)", "Коммиты (за год)"],
  ["Pull requests", "Pull requests", "Pull requests", "Пул-реквесты"],
  ["Issues", "Issues", "Issues", "Задачи"],
  ["Repositories", "Repositorios", "Repositórios", "Репозитории"],
  ["Followers", "Seguidores", "Seguidores", "Подписчики"],
  ["Following", "Siguiendo", "Seguindo", "Подписки"],
  ["Forks received", "Forks recibidos", "Forks recebidos", "Полученные форки"],
  ["Most used languages", "Lenguajes más usados", "Linguagens mais usadas", "Самые используемые языки"],
  ["Contributions", "Contribuciones", "Contribuições", "Вклад"],
  ["contributions in the last year", "contribuciones en el último año", "contribuições no último ano", "вкладов за последний год"],
  [MONTHS, "Ene,Feb,Mar,Abr,May,Jun,Jul,Ago,Sep,Oct,Nov,Dic", "Jan,Fev,Mar,Abr,Mai,Jun,Jul,Ago,Set,Out,Nov,Dez", "Янв,Фев,Мар,Апр,Май,Июн,Июл,Авг,Сен,Окт,Ноя,Дек"],
  ["Total contributions", "Contribuciones totales", "Contribuições totais", "Всего вкладов"],
  ["Current streak", "Racha actual", "Sequência atual", "Текущая серия"],
  ["Longest streak", "Racha más larga", "Maior sequência", "Самая длинная серия"],
  ["days", "días", "dias", "дней"],
  ["No description yet.", "Sin descripción todavía.", "Ainda sem descrição.", "Пока без описания."],
  ["Email", "Email", "E-mail", "Почта"],
  ["mailto:you@email.com", "mailto:tu@email.com", "mailto:voce@email.com", "mailto:you@email.com"],
  ["My portfolio", "Mi portafolio", "Meu portfólio", "Моё портфолио"],
  ["View repositories", "Ver repositorios", "Ver repositórios", "Мои репозитории"],
  ["New button", "Nuevo botón", "Novo botão", "Новая кнопка"],
  ["Design", "Diseño", "Design", "Дизайн"],
  ["Code", "Código", "Código", "Код"],
  ["Coffee", "Café", "Café", "Кофе"],
  ["Music", "Música", "Música", "Музыка"],
  ["My projects", "Mis proyectos", "Meus projetos", "Мои проекты"],
  ["Projects", "Proyectos", "Projetos", "Проекты"],
  ["Simplicity is the ultimate sophistication.", "La simplicidad es la máxima sofisticación.", "A simplicidade é o último grau de sofisticação.", "Простота — высшая степень изощрённости."],
  ["Leonardo da Vinci", "Leonardo da Vinci", "Leonardo da Vinci", "Леонардо да Винчи"],
  [
    "<!-- Write Markdown or HTML here: badges, GIFs, tables... -->\n**Thanks for visiting my profile!**",
    "<!-- Escribe aquí Markdown o HTML: badges, GIFs, tablas... -->\n**¡Gracias por visitar mi perfil!**",
    "<!-- Escreva Markdown ou HTML aqui: badges, GIFs, tabelas... -->\n**Obrigado por visitar meu perfil!**",
    "<!-- Пишите здесь Markdown или HTML: бейджи, GIF, таблицы... -->\n**Спасибо, что заглянули в мой профиль!**",
  ],
  ["Pixel art editor that runs in the browser, with layers and animation.", "Editor de pixel art que funciona en el navegador, con capas y animación.", "Editor de pixel art que roda no navegador, com camadas e animação.", "Редактор пиксель-арта в браузере, со слоями и анимацией."],
  ["Blazing fast terminal tools written in Rust.", "Herramientas de terminal ultrarrápidas escritas en Rust.", "Ferramentas de terminal ultrarrápidas escritas em Rust.", "Сверхбыстрые утилиты для терминала на Rust."],
  ["Machine learning experiments explained step by step.", "Experimentos de machine learning explicados paso a paso.", "Experimentos de machine learning explicados passo a passo.", "Эксперименты с машинным обучением с пошаговыми объяснениями."],
  ["My Neovim, terminal and desktop setup.", "Mi configuración de Neovim, terminal y escritorio.", "Minha configuração de Neovim, terminal e desktop.", "Мои настройки Neovim, терминала и рабочего стола."],
  ["Generated with Readmefy. Edit .readme/config.json or regenerate it from the web.", "Generado con Readmefy. Edita .readme/config.json o vuelve a generar desde la web.", "Gerado com Readmefy. Edite .readme/config.json ou gere novamente pela web.", "Создано в Readmefy. Отредактируйте .readme/config.json или сгенерируйте заново на сайте."],
];

const COL = { es: 1, pt: 2, ru: 3 };
const FWD = {};
const BACK = {};
for (const [lang, i] of Object.entries(COL)) {
  FWD[lang] = new Map(ROWS.map((r) => [r[0], r[i]]));
  BACK[lang] = new Map(ROWS.map((r) => [r[i], r[0]]));
}
const EN = new Set(ROWS.map((r) => r[0]));

export const tr = (lang, s) => FWD[lang]?.get(s) ?? s;

export const locale = (lang) => LOCALES[lang] ?? LOCALES.en;

// English key of a default text in a given language, or null for text the user wrote
function keyOf(lang, s) {
  if (lang === "en" || !BACK[lang]) return EN.has(s) ? s : null;
  return BACK[lang].get(s) ?? null;
}

// Swap every default text of the blocks from one language to another; anything the user typed stays
export function relocalize(cfg, from, to) {
  if (from === to) return cfg;
  const walk = (v) => {
    if (typeof v === "string") {
      const k = keyOf(from, v);
      return k === null ? v : tr(to, k);
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      for (const key of Object.keys(v)) if (key !== "id" && key !== "type") v[key] = walk(v[key]);
      return v;
    }
    return v;
  };
  cfg.blocks = cfg.blocks.map(walk);
  cfg.lang = to;
  return cfg;
}

// Translates the default strings inside an object (new list items, new blocks)
export function localizeDeep(lang, v) {
  if (typeof v === "string") return EN.has(v) ? tr(lang, v) : v;
  if (Array.isArray(v)) return v.map((x) => localizeDeep(lang, x));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, localizeDeep(lang, x)]));
  return v;
}
