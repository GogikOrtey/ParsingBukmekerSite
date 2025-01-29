const puppeteer = require('puppeteer');

// Открытие сайта:
// https://betboom.ru/sport/football

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Массив, в котором будут хранится все отсканированные ставки
let resultAllBetsArray = [];





//
// 1 Открывает браузер, и ждёт загрузки страницы
//

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
      if(msg.text() != "%c color:")
        console.log(`Браузер говорит: ${msg.text()}`);
    }
  });

  // Открываем указанную страницу и ждем полной загрузки
  await page.goto('https://betboom.ru/sport/football', { waitUntil: 'load' });



  // Ожидание загрузки элемента 
  await page.waitForSelector('button.zcABw-a84e8c10.mXIwY-a84e8c10');

  // console.log("Ждём 5 секунд");
  // await sleep(5000); // Ждём 5 секунд 

  await page.waitForSelector('.Ur2bE-a84e8c10');
  console.log("Хотя бы один нужный элемент загрузился");

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

  let parentElement;





  //
  // 2 Раскрывает списки
  //
  
  for (const element of elements_arrow_down) {
    
    // Выполняем код по раскрытию списков, для всех свёрнутых элементов, за исключением первого,
    // т.к. первый уже раскрыт
    if (arrCounterArrDown > 1) {
      if (arrCounterArrDown > 5) break; ///////////////// Открываем только 5 первых списков. Потом убрать этот код

      await element.evaluate(el => {
        el.scrollIntoView();
        el.style.border = '2px solid red'; // Добавляем красную рамку
      });

      await element.evaluate(el => {
        el.scrollIntoView();
        window.scrollBy(0, -300); // Прокрутка на 300 пикселей выше
      });
      // console.log("Прокрутка до элемента раскрытия списка № " + arrCounterArrDown);    


      // Находим родительский элемент с классом .A7vA9-a84e8c10 до клика
      parentElement = await element.evaluateHandle(el => {
        return el.closest('.A7vA9-a84e8c10');
      });

      if (parentElement) {
        await element.click();
        // console.log("Нажали на элемент раскрытия списка");

        // Ожидаем появления элемента с классом .Ur2bE-a84e8c10 внутри найденного родительского элемента
        await page.waitForFunction(parent => {
          return parent.querySelector('.Ur2bE-a84e8c10') !== null;
        }, { timeout: 5000 }, parentElement);

        // console.log("Внутренние элементы корректно загрузились");
      }

      await element.evaluate(el => {
        el.style.border = ''; // Удаляем красную рамку
      });

      console.log("Раскрытие списка №" + arrCounterArrDown + " корректно");
    }
    else {
      // Получение первого элемента с классом .A7vA9-a84e8c10
      parentElement = await page.$('.A7vA9-a84e8c10');
    }





    //
    // 3 Проходит по каждой ставке в списке
    //

    // И сохраняет информацию в массивы
    const childDivs = await parentElement.$$('.Ur2bE-a84e8c10');

    console.log("Получили все ставки в этом списке. length = " + childDivs.length);
  
    for (const div of childDivs) {
      let info = [];

      // Извлекаем первый элемент span с классом rzys6-a84e8c10
      const spans = await div.$$('.rzys6-a84e8c10');
      if (spans.length > 0) {
        const span1Text = await page.evaluate(element => element.textContent, spans[0]);
        info.push(span1Text);
      } else {
        info.push(null);
      }

      // Извлекаем второй элемент span с классом rzys6-a84e8c10
      if (spans.length > 1) {
        const span2Text = await page.evaluate(element => element.textContent, spans[1]);
        info.push(span2Text);
      } else {
        info.push(null);
      }
  
      // Извлекаем элемент time с классом dHlnp-a84e8c10
      const timeElement = await div.$('.dHlnp-a84e8c10');
      const timeText = await page.evaluate(element => element.textContent, timeElement);
      info.push(timeText);

      // Извлекаем элементы span с классом do7iP-a84e8c10
      const span3 = await div.$$('.do7iP-a84e8c10');
      for (let i = 0; i < 3; i++) {
        const spanText = await page.evaluate(element => element.textContent, span3[i]);
        info.push(spanText);
      }

      // console.log("info:");
      // console.log(info);
  
      resultAllBetsArray.push(info);
    }

    break; //////////////////////////////////////////////////// Этот код обработает только первый раскрытый список

    arrCounterArrDown++;
  }

  //
  // _ Выводит полученный массив 
  //

  console.log("resultAllBetsArray: ");
  console.log(resultAllBetsArray);

})();















