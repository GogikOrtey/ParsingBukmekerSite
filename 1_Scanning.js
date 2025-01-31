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


const { exec } = require('child_process');

// Функция для отключения интернета
function disableInternet() {
    exec('netsh advfirewall firewall add rule name="Block Internet" dir=out action=block protocol=TCP', (error) => {
        if (error) {
            console.error(`Error disabling internet: ${error}`);
        } else {
            console.log('Internet connection disabled.');
        }
    });
}

// Функция для включения интернета
function enableInternet() {
    exec('netsh advfirewall firewall delete rule name="Block Internet"', (error) => {
        if (error) {
            console.error(`Error enabling internet: ${error}`);
        } else {
            console.log('Internet connection enabled.');
        }
    });
}

// enableInternet();









/*                                ОПИСАНИЕ:

Этот скрипт сканирует страницу со ставками на футбол: betboom.ru/sport/football,
и в результате получает массив ставок, который имеет следующую структуру:

Пример вывода:

[
...
  [
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
  const elements_arrow_down = await page.$$('[class^="h4qas"]');

  let arrCounterArrDown = 1;

  let parentElement;





  //
  // 2 Раскрывает списки
  //

  let inputStringDatabet;
  let childDivs;
  
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
    childDivs = await parentElement.$$('[class^="Ur2bE"]');

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
    let cur_inputStringDatabet = resultAllBetsArray[i][2];

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
    for(let j = 3; j < 6; j++) {
      resultAllBetsArray[i][j] = resultAllBetsArray[i][j].replace(".", ",")
    }
    resultAllBetsArray[i][8] = resultAllBetsArray[i][8].replace(".", ",")
  }



  //
  // Вытаскивает ссылку на событие, из каждой ставки
  //

  // Выключает интернет
  // disableInternet();

  console.log("🔴🔴🔴 Отключай интернет!");
  await sleep(3500);



  // Завтра:


  // Здесь также нужно вытащить сначала название лиги


  // Затем, для каждой лиги футбола найти страницу с рейтингом
    // Как минимум сначала для УЕФА
  // И вытащить от туда все порядковые номера, по названиям команд
  // Добавить их обработку в список (уже после того, как его сформируем, и пройдёмся по сайту букмекера)


  // Добавить постинг сообщений в Тг
    // Сделать грязные и чистые логи
    // Сделать так, что бы после сканирования, файлик загружался в эти логи


  // Добавить табличку с событиями
  // Написать программу, которая будет работать по таймеру, и выполнять эти события


  // В таблице главного сканирования - создать отдельную структуру на ставки:
    // К1 + К2 + дата = уникальный ИД
    // Для каждого уникального ИД может быть много временных меток, с коэффициентами
    // Также, результаты могут быть, а могут нет 

  // Т.е. оставить сканер таким какой он есть, но добавить слой обработки дальше, перед выгрузкой в таблицу сканирования
  // где бы информация нужным образом группировалась


  // Поправить оформление главного файлика сканирования
  // Добавить действия на получение данных
    // Это обновление коэффициентов, по ссылке из сканирования
    // Получение результатов матча, если по таймеру время уже прошло
    // И получение новых наборов данных - коэффициенты + текущий счёт

  // Реализовать добавление результата к ставке, после завершения события

  // И после этого уже можно будет переносить всю программу на VPS
    // Проверять
    // И оставлять запущенной - собирать логи

  // А дальше - проектировать и обучать нейросеть

  
  

  console.log("Начинаем парсинг ссылок событий")

  let massChildDivsLength = childDivs.length;

  for (let i = 0; i < massChildDivsLength; i++) {
    // Каждую итерацию цикла перенахожу элементы-кнопки ставок
    parentElement = await page.$('[class^="A7vA9"]');
    childDivs = await parentElement.$$('[class^="Ur2bE"]');

    // Получение кнопки внутри текущего элемента
    const button = await childDivs[i].$('div[class^="xLmig"]');

    // // Прокрутка до этого элемента
    // button.scrollIntoView(); 

    if (button) {
      // Прокрутка к элементу
      await page.evaluate(element => {
        element.scrollIntoView({ block: 'center' });
      }, button);

      // Получение размера и положения элемента
      const boundingBox = await button.boundingBox();

      if (boundingBox) {
        // Вычисление координат клика (100 пикселей справа и по центру по вертикали)
        const clickX = boundingBox.x + 100;
        const clickY = boundingBox.y + (boundingBox.height / 2);

        // Сохраняем текущий URL страницы
        const currentURL = page.url();

        // Выполнение клика по вычисленным координатам
        await page.mouse.click(clickX, clickY);

        // Ожидание изменения URL
        await page.waitForFunction(`window.location.href !== '${currentURL}'`);

        // Добавление текущего URL в массив результатов
        resultAllBetsArray[i].push(page.url());

        console.log("Сохранили URL " + (i+1) + "й страницы")

        // await sleep(5000); ////////////////// для отладки

        await sleep(300);

        // Возврат на исходную страницу
        await page.goBack();

        await sleep(300);
      }
    }
  }



  console.log("> Включай интернет!");
  // await sleep(2500);


  // Включает интернет
  // enableInternet();


  // // Включаю интернет-соединение
  // // Для Windows
  // exec('netsh interface set interface "Ethernet" admin=enable', (err, stdout, stderr) => {
  //   if (err) {
  //     console.error(`Ошибка включения интернета: ${stderr}`);
  //     return;
  //   }
  //   console.log("Интернет включён");
  // });

  // // !@
  // // Восстанавливаю подключение к интернету во внутреннем браузере
  // console.log("Восстанавливаю подключение к интернету во внутреннем браузере");
  // await page.setRequestInterception(false);
  // page.removeAllListeners('request');





  // Тогда сосредоточится на лиге УЕФА - добавить парсер на один или сразу 2 сайта с таблицей результатов

  // И узнать, сколько по времени длится один матч (и сколько у него частей)

  // И добавить сообщения в Тг


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



  // //
  // // Формирует UID для каждой записи
  // //

  // // UID = Уникальный id

  // for(let i = 0; i < resultAllBetsArray.length; i++) {


  // }



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


})();















