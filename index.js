const puppeteer = require('puppeteer');
const fs = require('fs');
const xlsx = require('xlsx');
const moment = require('moment');


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

  console.log("Запуск программы")



  // Ожидание загрузки элемента 
  // await page.waitForSelector('button.zcABw-a84e8c10.mXIwY-a84e8c10');
  await page.waitForSelector('[class^="zcABw"]');

  // console.log("Ждём 5 секунд");
  // await sleep(5000); // Ждём 5 секунд 

  await page.waitForSelector('[class^="Ur2bE"]');
  console.log("Хотя бы один нужный элемент загрузился");

  // Поиск и клик по кнопке с текстом "1д"
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('[class^="zcABw"]'));
    const targetButton = buttons.find(button => button.textContent === '1д');
    if (targetButton) {
      targetButton.click();
      console.log("Кликнули по кнопке '1д'");
    }
  });



  // Ожидание загрузки элементов с классом 'h4qas-a84e8c10'
  await page.waitForSelector('[class^="h4qas"]');

  // Получение всех элементов с классом 'h4qas-a84e8c10'
  const elements_arrow_down = await page.$$('[class^="h4qas"]');

  let arrCounterArrDown = 1;

  let parentElement;





  //
  // 2 Раскрывает списки
  //

  let inputStringDatabet;
  
  for (const element of elements_arrow_down) {
    
    // Выполняем код по раскрытию списков, для всех свёрнутых элементов, за исключением первого,
    // т.к. первый уже раскрыт
    if (arrCounterArrDown > 1) {
      // if (arrCounterArrDown > 5) break; ///////////////// Открываем только 5 первых списков. Потом убрать этот код

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
        return el.closest('[class^="A7vA9"]');
      });

      if (parentElement) {
        await element.click();
        // console.log("Нажали на элемент раскрытия списка");

        // Ожидаем появления элемента с классом .Ur2bE-a84e8c10 внутри найденного родительского элемента
        await page.waitForFunction(parent => {
          return parent.querySelector('[class^="Ur2bE"]') !== null;
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
      parentElement = await page.$('[class^="A7vA9"]');
    }





    //
    // 3 Проходит по каждой ставке в списке
    //

    // И сохраняет информацию в массивы
    const childDivs = await parentElement.$$('[class^="Ur2bE"]');

    console.log("Получили все ставки в этом списке. length = " + childDivs.length);
  
    for (const div of childDivs) {
      let info = [];

      // Извлекаем первый элемент span с классом rzys6-a84e8c10
      const spans = await div.$$('[class^="rzys6"]');
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
      const timeElement = await div.$('[class^="dHlnp"]');
      const timeText = await page.evaluate(element => element.textContent, timeElement);
      info.push(timeText);
      inputStringDatabet = timeText;

      // Извлекаем элементы span с классом do7iP-a84e8c10
      const span3 = await div.$$('[class^="do7iP"]');
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
  // Выводит полученный массив 
  //

  console.log("resultAllBetsArray: ");
  console.log(resultAllBetsArray);



  //
  // Обработчик даты
  //

  function parseEventDate(eventString) {
    const now = moment();
    let eventDate;

    if (eventString.startsWith('Сегодня')) {
      eventDate = moment(now.format('YYYY-MM-DD') + ' ' + eventString.split(' ')[1], 'YYYY-MM-DD HH:mm');
    } else if (eventString.startsWith('Завтра')) {
      eventDate = moment(now.add(1, 'days').format('YYYY-MM-DD') + ' ' + eventString.split(' ')[1], 'YYYY-MM-DD HH:mm');
    }

    return eventDate;
  }

  function hoursUntilEvent(eventDate) {
    const now = moment();
    return eventDate.diff(now, 'hours', true);
  }

  // Входное время лежит в inputStringDatabet

  let currentDate = moment().format('YYYY-MM-DD HH:mm');
  let processingDataBet = parseEventDate(inputStringDatabet);
  let hoursWidthVet = hoursUntilEvent(processingDataBet);

  console.log("🕑 Входная строка времени: " + inputStringDatabet);
  console.log("🕑 Текущая дата и время: " + currentDate);
  console.log("🕑 Обработанное время ставки: " + processingDataBet.format('YYYY-MM-DD HH:mm'));
  console.log("🕑 Часов до события: " + hoursWidthVet.toFixed(2));

  // const eventStringToday = 'Сегодня в 05:30';
  // const eventStringTomorrow = 'Завтра в 01:00';

  // const eventDateToday = parseEventDate(eventStringToday);
  // const eventDateTomorrow = parseEventDate(eventStringTomorrow);

  // console.log('Точная дата события "Сегодня в 05:30":', eventDateToday.format('YYYY-MM-DD HH:mm'));
  // console.log('Часов до события "Сегодня в 05:30":', hoursUntilEvent(eventDateToday));

  // console.log('Точная дата события "Завтра в 01:00":', eventDateTomorrow.format('YYYY-MM-DD HH:mm'));
  // console.log('Часов до события "Завтра в 01:00":', hoursUntilEvent(eventDateTomorrow));


  // Что бы в итоге получилось сначала 4 столбца с датой -
  // в текстовом виде, текуща дата, преобразованная в формат даты и
  // сколько осталось до матча (в часах)


  // Тогда сосредоточится на лиге УЕФА - добавить парсер на один или сразу 2 сайта с таблицей результатов

  // Также добавить ссылку на ставку, что бы можно было посмотреть результаты
    // Я буду блокировать интернет-соединение для открытого внутреннего браузера, и нажимать на элементы - они будут
    // открываться в этом же окне. Они не будут загружаться, но ссылка должна быть корректной
    // И при переходе на страницу назад, всё сохраняется

  // И узнать, сколько по времени длится один матч (и сколько у него частей)


  //
  // Сохраняет полученные данные в текстовый файл
  //

  // Преобразуем массив в строку с форматированием
  const dataString = resultAllBetsArray.map(arr => arr.join(',')).join('\n');

  // Записываем в файл
  fs.writeFile('resultAllBetsArray.txt', dataString, 'utf8', (err) => {
    if (err) {
      console.error('Ошибка при записи в текстовый файл', err);
    } else {
      console.log('Данные успешно записаны в текстовый файл');
    }
  });



  //
  // Сохраняет данные в формате таблицы Excel
  //

  // Создаем новую книгу и лист
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet([]);

  // Записываем данные в лист, начиная с 3-й строки и 2-го столбца
  resultAllBetsArray.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      xlsx.utils.sheet_add_aoa(worksheet, [[cell]], { origin: { r: rowIndex + 2, c: colIndex + 1 } });
    });
  });

  // Добавляем лист в книгу
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  // Записываем книгу в файл
  xlsx.writeFile(workbook, 'resultAllBetsArray.xlsx');

  console.log('Данные успешно записаны в Excel файл');


})();















