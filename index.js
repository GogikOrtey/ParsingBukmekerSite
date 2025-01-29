const puppeteer = require('puppeteer');

// // print();
// console.log("123")
// console.log()

// ——————————————————————
// Открытие сайта:
// https://betboom.ru/sport/football

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


(async () => {
  // Запускаем браузер с указанными размерами окна
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: {
      width: 650,
      height: 1000
    },
    args: [
      '--window-size=650,1000'
    ]
  });

  // Создаем новую страницу
  const page = await browser.newPage();

  // Получаем список всех страниц
  const pages = await browser.pages();

  // Закрываем первую (пустую) страницу
  if (pages.length > 0) {
    await pages[0].close();
  }

  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log(`Браузер говорит: ${msg.text()}`);
    }
  });

  // Открываем указанную страницу и ждем полной загрузки
  await page.goto('https://betboom.ru/sport/football', { waitUntil: 'load' });

  // // Ожидание 5 секунд
  // await sleep(5000);

  // // После полной загрузки страницы выводим сообщение в консоль
  // console.log('Страница полностью загружена!');

  // // Нажатие на первый элемент с классом 'h4qas-a84e8c10'
  // await page.click('.h4qas-a84e8c10');



  // Ожидание загрузки элемента 
  await page.waitForSelector('button.zcABw-a84e8c10.mXIwY-a84e8c10');

  // Поиск и клик по кнопке с текстом "1д"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button.zcABw-a84e8c10.mXIwY-a84e8c10'));
    const targetButton = buttons.find(button => button.textContent === '1д');
    if (targetButton) {
      targetButton.click();
      console.log("Кликнули по кнопке '1д'");
    }
  });



  // Ожидание загрузки элементов с классом 'h4qas-a84e8c10'
  await page.waitForSelector('.h4qas-a84e8c10');

  // Получение всех элементов с классом 'h4qas-a84e8c10'
  const elements_arrow_down = await page.$$('.h4qas-a84e8c10');

  // Нажатие на каждый элемент и ожидание загрузки элемента с классом 'Ur2bE-a84e8c10'
  for (const element of elements_arrow_down) {
    await element.evaluate(el => el.scrollIntoView());
    await element.click();
    console.log("Нажали на элемент раскрытия списка");
    await page.waitForSelector('.A7vA9-a84e8c10 .Ur2bE-a84e8c10', { timeout: 5000 });
    await sleep(10000); // Ждём 10 секунд
  }

  // // Нажатие на каждый элемент
  // for (const element of elements_arrow_down) {
  //   await element.evaluate(el => el.scrollIntoView());
  //   await element.click();
  // }

  // <div class="Ur2bE-a84e8c10">



  // Повторное нажатие на первый элемент
  if (elements_arrow_down.length > 0) {
    const firstElement = elements_arrow_down[0];
    await firstElement.evaluate(el => el.scrollIntoView());
    await firstElement.click();
    console.log("Нажали на первый элемент раскрытия списка");
  }
})();


















