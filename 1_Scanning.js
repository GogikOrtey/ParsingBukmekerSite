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


// const { exec } = require('child_process');



/////////////////////////////////////////////////////////////////////////
//////////////////////      Важные настройки:      //////////////////////


// Ограничение на количество обработанных списков
// Если = 0, то без ограничения
const limitOfProcess = 3; 

// Мы закрываем окно браузера, после завершения скрипта?
const bool_isClosetBrowserAfterEndingOfScript = true;


/////////////////////////////////////////////////////////////////////////

if(limitOfProcess > 0) {
  console.log("🔒 Есть ограничение на количество обрабатываемых списков: только " + limitOfProcess);
}
if(bool_isClosetBrowserAfterEndingOfScript == true) {
  console.log("Окно браузера будет закрыто, после выполнения кода");
} else {
  console.log("Окно браузера не будет закрыто, после выполнения кода");
}





/*                                ОПИСАНИЕ:

Этот скрипт сканирует страницу со ставками на футбол: betboom.ru/sport/football,
и в результате получает массив ставок, который имеет следующую структуру:

Пример вывода:

[
...
  [
    'УЕФА Лига'           - Название лиги (либо страна + лига)
    'Аякс',               - Название первой команды
    'Галатасарай',        - Название второй команды
    'Завтра в 01:00',     - Строковое описание времени события
    '2,34',               - Коэффициент на победу первой команды
    '3,85',               - Коэффициент на ничью
    '2,85',               - Коэффициент на победу второй команды
    '30-01-2025 23:58',   - Дата и время сканирования
    '31-01-2025 01:00',   - Дата и время события
    '1,03',               - Сколько часов осталось до события (в десятичной сс)
    'https://betboom.ru/sport/football/126/239/1344419'  - Ссылка на событие, для дальнейшего отслеживания
  ],
...
]

Планируется, что этот скрипт будет запускаться 2 раза в сутки
Сканировать все доступные ставки и их коэффициенты, и записывать их в выходной файл-таблицу

Затем, следующая программа [3_AddScanResNumKoeff.js] - будет запускаться, и добавлять
в выходной файл-таблицу номера команд по рейтингу, из открытых источников

Весь этот процесс сканирования запускает программа [2_ProcessingScanning.js]
Она же будет и следить за корректным завершением обоих этих программ

И затем, после получения нужного файла-таблицы, она будет вносить данные из неё, в
основную таблицу - MainBetsTable.xlsx

Попутно, добавляя события на проверку коэффициентов (ещё 4 раза), и результатов (после завершения матча),
в таблицу заданий - TaskTable.xlsx

Ну и также будет добавлять ещё одно сканирование через пол дня

Над этой таблицей будет работать программа-автотаймер [5_AutoTimer.js]
Она будет каждые 10 минут проверять все события, записанные в TaskTable.xlsx, и если
подошло время для выполнения какого-либо события, то она будет его запускать

Т.е. получается, в MainBetsTable.xlsx, после первичного сканирования, появится 
по 1 записи, на каждую найденную ставку. И также в TaskTable.xlsx появится 5 событий для этой ставки:
4 раза отсканировать её по прямой ссылке, и 5й раз - отсканировать по прямой ссылке, но уже результаты

Эти результаты и коэффициенты будут также заноситься в таблицу MainBetsTable.xlsx
Над этим будет работать другая программа [4_ScanningDirectLink.js]








*/


/* Справка по времени матчей:

Стандартный футбольный матч длится 90 минут, разделенных на два тайма по 45 минут каждый. 
Между таймами есть 15-минутный перерыв, когда команды отдыхают и тренеры могут дать инструкции своим игрокам. 
Таким образом, общее время, включая перерыв, составляет 105 минут.

*/







// Планы на заватра:

/*
  Написать 2й скрипт, что бы он запускал 1й
  И потом правильно форматировал вывод в главную таблицу

  И также написать 3й скрипт, который бы сканировал рейтинги, и также записывал в таблицу

  Ну и если останется время - то либо заняться сканером по прямой ссылке события, либо таймером с его табличкой
*/













/// Вот здесь добавить маркер, было ли завершение программы корректным





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

  try {
    // Пытаемся дождаться элемента в течение 10 секунд
    await page.waitForSelector('[class^="Ur2bE"]', { timeout: 12000 });

  } catch (error) {
    console.log('Элемент не найден в течение 12 секунд.');

    // Проверяем наличие элемента с текстом "Ошибка загрузки данных"
    const isErrorElementPresent = await page.evaluate(() => {
      const errorElement = document.querySelector('[class^="QUM9B"]');
      return errorElement && errorElement.textContent.includes('Ошибка загрузки данных');
    });

    if (isErrorElementPresent) {
      console.log('Ошибка загрузки данных, программа завершает работу с ошибкой');
      await browser.close();
      return;
    } 
  }

  console.log("Хотя бы один нужный элемент загрузился, идём дальше");

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
  let elements_arrow_down = await page.$$('[class^="h4qas"]');

  let arrCounterArrDown = 1;

  let parentElement;





  //
  // 2 Раскрывает списки
  //

  let inputStringDatabet;
  let childDivs;
  
  // Этот цикл идёт по всем спискам, и раскрывает их
  for (const element of elements_arrow_down) {
    
    // // Каждую итерацию заново сканируем страницу на наличие элементов раскрытия списка
    // // т.к. после перезагрузки они выгружаются
    // elements_arrow_down = await page.$$('[class^="h4qas"]');

    // Выполняем код по раскрытию списков, для всех свёрнутых элементов, за исключением первого,
    // т.к. первый уже раскрыт
    if (arrCounterArrDown > 1) {
      if(limitOfProcess != 0) {
        if(arrCounterArrDown > limitOfProcess) {
          console.log("Мы дошли до ограничения в разворачивании списков: " + limitOfProcess + ", останавливаемся");
          break;
        }
      }

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

    let nameOfLiga = await page.evaluate((element) => {
      return element.getAttribute('data-at-name');
    }, parentElement);

    // nameOfLiga = nameOfLiga.substring(4);
    nameOfLiga = nameOfLiga.split(' ').slice(1).join(' ');








    //
    // 3 Проходит по каждой ставке в списке
    //

    // И сохраняет информацию в массивы
    childDivs = await parentElement.$$('[class^="Ur2bE"]');

    console.log("Получили все ставки в этом списке. length = " + childDivs.length);
  
    for (const div of childDivs) {
      let info = [];

      info.push(nameOfLiga);

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

    arrCounterArrDown++;
  }



  // //
  // // Выводит полученный массив 
  // //

  // console.log("resultAllBetsArray: ");
  // console.log(resultAllBetsArray);



  //
  // Обработчик даты
  //  

  function parseEventDate(eventString) {
    let eventDate;
  
    if (eventString.toLowerCase().includes("сегодня")) {
      eventDate = moment().startOf('day');
      eventString = eventString.replace(/сегодня/i, '').trim();
    } else if (eventString.toLowerCase().includes("завтра")) {
      eventDate = moment().add(1, 'days').startOf('day');
      eventString = eventString.replace(/завтра/i, '').trim();
    } else {
      console.log("Неизвестный формат даты");
    }
  
    let time = eventString.match(/(\d{1,2}):(\d{2})/);
    if (time) {
      eventDate.hour(parseInt(time[1], 10)).minute(parseInt(time[2], 10));
    } else {
      console.log("Неверный формат времени");
    }
  
    return eventDate;
  }
  
  function hoursUntilEvent(eventDate) {
    const now = moment();
    return eventDate.diff(now, 'hours', true);
  }
  
  // Входное время лежит в inputStringDatabet
  
  // let currentDate = moment().format('DD-MM-YYYY HH:mm');
  // let processingDataBet = parseEventDate(inputStringDatabet);
  // let hoursWidthVet = hoursUntilEvent(processingDataBet);
  
  // console.log("Входная строка времени: " + inputStringDatabet);
  // console.log("Текущая дата и время: " + currentDate);
  // console.log("Обработанное время ставки: " + processingDataBet.format('DD-MM-YYYY HH:mm'));
  // console.log("Часов до события: " + hoursWidthVet.toFixed(2));


  for (let i = 0; i < resultAllBetsArray.length; i++) {
    let cur_inputStringDatabet = resultAllBetsArray[i][3];

    let currentDate = moment().format('DD-MM-YYYY HH:mm');
    let processingDataBet = parseEventDate(cur_inputStringDatabet);
    let hoursWidthVet = hoursUntilEvent(processingDataBet);

    resultAllBetsArray[i].push(currentDate)
    resultAllBetsArray[i].push(processingDataBet.format('DD-MM-YYYY HH:mm'))
    resultAllBetsArray[i].push(hoursWidthVet.toFixed(2))
  }




  //
  // Заменяю точки на запятые в коэффициентах
  //

  for (let i = 0; i < resultAllBetsArray.length; i++) {
    for(let j = 4; j < 7; j++) {
      resultAllBetsArray[i][j] = resultAllBetsArray[i][j].replace(".", ",")
    }
    resultAllBetsArray[i][9] = resultAllBetsArray[i][9].replace(".", ",")
  }



  //
  // Вытаскивает ссылку на событие, из каждой ставки
  //




  

  // Выключает интернет
  // disableInternet();

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');

  console.log("Отключение интернета");

  // Отключение интернета
  await client.send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0
  });


  
  // Эта функция открывает список
  async function ListOpened() {
    // Ещё раз получаем все стрелки раскрытия списков
    elements_arrow_down = await page.$$('[class^="h4qas"]');

    // Получаем корректную ссылку на текущий список, который надо раскрыть
    element = elements_arrow_down[arrCounterArrDown_onParsLink];

    await element.evaluate(el => {
      el.scrollIntoView();
      window.scrollBy(0, -300); // Прокрутка на 300 пикселей выше
    });

    if (parentElement) {
      await element.click();

      // Ожидаем появления элемента с классом .Ur2bE-a84e8c10 внутри найденного родительского элемента
      await page.waitForFunction(parent => {
        return parent.querySelector('[class^="Ur2bE"]') !== null;
      }, { timeout: 5000 }, parentElement);

      console.log("Список №" + arrCounterArrDown_onParsLink + " корректно раскрылся");
    }
  }














  console.log("Начинаем парсинг ссылок событий")

  // Счётчик того, на каком конкретно мы сейчас сипске
  // Также он = another_i
  let arrCounterArrDown_onParsLink = 0; 

  elements_arrow_down = await page.$$('[class^="h4qas"]');

  let elArrowDown_length = elements_arrow_down.length;
  
  // Был ли этот список уже открыт один раз?
  // Это потому, что в двух вложенных циклах for, фунция раскрытия текущего списка
  // может встретится 2 раза подряд, и открыть, а затем свернуть список.
  // Данная переменная позволяет этого избежать
  let onseListOpened = false;

  // Порядковый номер, для корректного сохранения ссылки в выходной массив resultAllBetsArray
  let ordinalNumber = 0;


  // Идём по всем спискам
  for (let another_i = 0; another_i < elArrowDown_length; another_i++) {

    if(limitOfProcess != 0) {
      if(arrCounterArrDown_onParsLink > limitOfProcess) {
        console.log("Мы дошли до ограничения в сохранении ссылок. Останавливаемся на " + limitOfProcess + " списке");
        break;
      }
    }


    console.log("Начинаем обработку списка со ставками №" + arrCounterArrDown_onParsLink);

    // Раскрываем обрабатываемый список:

    // Если это не первый список
    if (arrCounterArrDown_onParsLink > 0) {
      
      // Раскрываем этот список
      await ListOpened();

      onseListOpened = true; 
    }



    massParentElement = await page.$$('[class^="A7vA9"]');            // Массив, содержащий все списки
    parentElement = massParentElement[arrCounterArrDown_onParsLink];  // Получаем текущий список
    childDivs = await parentElement.$$('[class^="Ur2bE"]');           // Все ставки в этом списке

    let massChildDivsLength = childDivs.length;

    console.log("Количество ставок в этом списке = " + massChildDivsLength);



    // Идём по всем кнопкам ставок внутри одного списка
    for (let i = 0; i < massChildDivsLength; i++) {

      // Ждём загрузки хотя бы одного нужного нам элемента
      // Это маркер того, что страница корректно загрузилась
      await page.waitForSelector('[class^="h4qas"]', { timeout: 5000 });
      await sleep(350); 

      if(arrCounterArrDown_onParsLink == 0)
      {
        // Если мы разбираем первый список, то его раскрывать не нужно
        // После перезагрузки страницы, он раскрыт автоматически

        console.log("Обрабатываем список 1, раскрыте не требуется");
      } else {
        // Однако, если мы работаем с другими списками, то его нужно развернуть:

        if (onseListOpened == false) {

          //
          // Разворачиваем текущий список
          //

          await ListOpened();
          
        } else {
          onseListOpened = false;
        }
      }





      // Каждую итерацию цикла перенахожу элементы-кнопки ставок
      massParentElement = await page.$$('[class^="A7vA9"]');            // Массив, содержащий все списки
      parentElement = massParentElement[arrCounterArrDown_onParsLink];  // Получаем текущий список
      childDivs = await parentElement.$$('[class^="Ur2bE"]');           // Все ставки в этом списке


      // Получение кнопки внутри текущего элемента
      const button = await childDivs[i].$('div[class^="xLmig"]');
      const selectedEl = await childDivs[i].$('div[class^="Uodqj"]');


      if (button) {
        // Прокрутка к элементу
        await page.evaluate(element => {
          element.scrollIntoView({ block: 'center' });
        }, button);

        // Добавляем красную рамку
        await page.evaluate(element => {
          element.style.border = '2px solid red';
        }, selectedEl);


        // Сохраняем текущий URL страницы
        const currentURL = page.url();

        // console.log("Задержка перед кликом");
        // await sleep(200); 




        console.log("Выполнение клика");

        const offsetX = -10; // Сдвиг по X (левее на 10 пикселей)
        const offsetY = 0;  // Сдвиг по Y (без изменения)

        const boundingBox = await button.boundingBox();

        if (boundingBox) {
          const clickX = boundingBox.width / 2 + offsetX;
          const clickY = boundingBox.height / 2 + offsetY;

          await button.click({
            offset: {
              x: clickX,
              y: clickY
            }
          });
        }

        console.log("Клик выполнен");





        // Убираем красную рамку
        await page.evaluate(element => {
          element.style.border = '';
        }, selectedEl);

        // Ожидание изменения URL
        await page.waitForFunction(`window.location.href !== '${currentURL}'`);

        // Добавление текущего URL в массив результатов
        resultAllBetsArray[ordinalNumber].push(page.url());
        ordinalNumber++;

        console.log("Сохранили URL " + (i + 1) + "й страницы ставки, с порядковым номером " + ordinalNumber);

        // await sleep(5000); ////////////////// для отладки

        // Возврат на исходную страницу
        await page.goBack();

        console.log("Выполняем код дальше");
      }
    }

    arrCounterArrDown_onParsLink++;
  }







  // Включение интернета обратно
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 0,
    downloadThroughput: 100 * 1024 * 1024 / 8, // 100Mbps
    uploadThroughput: 100 * 1024 * 1024 / 8 // 100Mbps
  });

  console.log("Интернет включён");






  //
  // Сохраняет полученные данные в текстовый файл
  //

  // // Преобразуем массив в строку с форматированием
  // const dataString = resultAllBetsArray.map(arr => arr.join(',')).join('\n');

  // // Записываем в файл
  // fs.writeFile('resultScan.txt', dataString, 'utf8', (err) => {
  //   if (err) {
  //     console.error('Ошибка при записи в текстовый файл', err);
  //   } else {
  //     console.log('Данные успешно записаны в текстовый файл');
  //   }
  // });







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
  xlsx.writeFile(workbook, 'resultScan.xlsx');

  console.log('Данные успешно записаны в Excel файл');




  //
  // Выводит полученный массив 
  //

  console.log("resultAllBetsArray: ");
  console.log(resultAllBetsArray);




  //
  // Завершение работы скрипта
  //

  // Закрывает браузер, после завершения выполнения скрипта, если переменная так выставлена
  if(bool_isClosetBrowserAfterEndingOfScript == true) {
    await browser.close();
    console.log("🟢 Скрипт корректно завершлся, мы закрыли браузер");
  } else {
    console.log("🔵 Скрипт корректно завершлся, но мы не закрываем браузер");
  }
})();















