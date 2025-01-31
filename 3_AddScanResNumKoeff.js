const xlsx = require('xlsx');
const path = require('path');


/*                                ОПИСАНИЕ:

Этот скрипт запускается после сканирования 1_Scanning.js
берёт таблицу resultScan.xlsx, загружает данные из неё во внутренние массивы

Затем, для каждой лиги, проходит по всем ставкам на события в ней
Заходит на соответствующий сайт с рейтиногм
И находит порядковые номера в рейтинговом списке, для каждого названия команды

Далее - сохраняет эту информацию, и передаёт управление обратно в скрипт 2_ProcessingScanning.js
Который правильно её обрабатывает, и добавляет записи в таблицу всех ставок MainBetsTable.xlsx
А также необходимые события в TaskTable.xlsx

*/








//
// Загружаю данные из файла resultScan.xlsx во внутренний массив программы
//

let inputArray = [];

// Путь к файлу
const filePath = path.join(__dirname, 'resultScan.xlsx');

// Загрузка файла
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Преобразование листа в JSON
const jsonData = xlsx.utils.sheet_to_json(sheet, {header: 1});

for (let row = 0; row < jsonData.length; row++) {
    const rowData = [];
    for (let col = 0; col < jsonData[row].length; col++) { 
        rowData.push(jsonData[row][col]);
    }
    inputArray.push(rowData);
}

console.log(inputArray);





//
// Главный цикл поиска рейтинговых мест
//


let currentLigaName = "";

let allBetsGroopedByLiga; // Это массив, в котором все ставку будут сгруппированы по лигам
/*
    Структура следующая:

    allBetsGroopedByLiga = 
    [
        Внутренние массивы, без имени:

        [
            Название первой лиги,
            [ Вся информация о ставке ],
            [ Вся информация о ставке ],
            ...
            [ Вся информация о ставке ]
        ],
        [
            Название второй лиги,
            [ Вся информация о ставке ],
            [ Вся информация о ставке ],
            ...
            [ Вся информация о ставке ]
        ]
        ...
    ]
*/

for(let i = 0; i < inputArray.length; i++) {
    
}










































