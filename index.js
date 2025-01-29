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

  console.log("Ждём 5 секунд");
  await sleep(5000); // Ждём 5 секунд

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

  let arrCounterArrDown = 1;



  // Нажатие на каждый элемент и ожидание загрузки элемента с классом 'Ur2bE-a84e8c10'
  for (const element of elements_arrow_down) {
    if(arrCounterArrDown == 1) {
      arrCounterArrDown++;
      continue;
    }
    await element.evaluate(el => {
      el.scrollIntoView();
      el.style.border = '2px solid red'; // Добавляем красную рамку
    });
    
    // await element.evaluate(el => el.scrollIntoView());
    // console.log("Прокрутка до элемента раскрытия списка № " + arrCounterArrDown);

    await element.evaluate(el => {
      el.scrollIntoView();
      window.scrollBy(0, -300); // Прокрутка на 300 пикселей выше
    });
    console.log("Прокрутка до элемента раскрытия списка № " + arrCounterArrDown);    


    const parentElement = await page.evaluate(el => {
      const parent = el.closest('.A7vA9-a84e8c10');
      return parent ? parent.outerHTML : null;
    }, element);

    if (parentElement) {
      await element.click();
      console.log("Нажали на элемент раскрытия списка");

      // Ожидаем появления элемента с классом .Ur2bE-a84e8c10 внутри найденного родительского элемента
      await page.waitForFunction((parentHTML) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = parentHTML;
        const parent = tempDiv.firstChild;
        return parent.querySelector('.Ur2bE-a84e8c10') !== null;
      }, { timeout: 50000 }, parentElement);

      console.log("Внутренние элементы корректно загрузились");
    } else {
      console.log("Не удалось найти родительский элемент с классом .A7vA9-a84e8c10 до клика");
    }



    // console.log("Подождали, пока загрузятся внутренние элементы");

    // await sleep(500); // Ждём 5 секунд
    // console.log("Ждём 0,5 секунд");

    await element.evaluate(el => {
      el.style.border = ''; // Удаляем красную рамку
    });

    arrCounterArrDown++;
  }

})();


















