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
  // Запускаем браузер
  const browser = await puppeteer.launch({ headless: false });

  // Создаем новую страницу
  const page = await browser.newPage();

  // Открываем указанную страницу и ждем полной загрузки
  await page.goto('https://betboom.ru/sport/football', { waitUntil: 'load' });

  // // Ожидание 5 секунд
  // await sleep(5000);

  // // После полной загрузки страницы выводим сообщение в консоль
  // console.log('Страница полностью загружена!');

  // // Нажатие на первый элемент с классом 'h4qas-a84e8c10'
  // await page.click('.h4qas-a84e8c10');

  // Ожидание загрузки элементов с классом 'h4qas-a84e8c10'
  await page.waitForSelector('.h4qas-a84e8c10');

  // Прокрутка элемента в видимую область и нажатие на него
  const element = await page.$('.h4qas-a84e8c10');
  await element.evaluate(el => el.scrollIntoView());
  await element.click();

  // Закрываем браузер (по желанию)
  // await browser.close();
})();


















