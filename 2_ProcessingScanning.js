const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);
const fs = require('fs');
const path = require('path');


/*                                ОПИСАНИЕ:

Этот скрипт управляет другими скриптами:

    1_Scanning.js - который сканирует все существующие ставки на футбол с сайта букмекера
    и
    3_AddScanResNumKoeff.js - который запускается после первого, и добавляет к каждой ставке
    порядковые номера команд по рейтингу, который он находит в открытом доступе

Данный скрипт запускается автоматически, через 5_AutoTimer.js, каждые пол дня

*/






//
// Запускаю сприпт 1_Scanning.js
//





// Открываем пространство асинхронного выполнения кода
// т.е. только последовательного:

(async () => {
    // Макисмальное количество попыток запуска скрипта загрузки
    const maxRetries = 7; 
    // Текущее количество попыток
    let attempt = 0;

    let errorLogs = "";

    while (attempt < maxRetries) {
        attempt++;
        const start = Date.now();

        try {
            // Запускаем скрипт
            const { stdout, stderr } = await execPromise('node 1_Scanning.js');
            
            // Вычисляем таймер
            const duration = (Date.now() - start) / 1000;

            // Выводим в консоль этого скрипта логи того скрипта
            console.log('Сканирование завершено: 1_Scanning.js завершился');
            console.log(`Лог этого скрипта: ${stdout}`);
            // console.error(`Ошибки этого скрипта: ${stderr}`);
            
            // Выводим время выполнения скрипта
            if (duration > 120) {
                console.log(`Время выполнения сканирования: ${(duration / 60).toFixed(1)} минут`);
            } else {
                console.log(`Время выполнения сканирования: ${duration.toFixed(0)} секунд`);
            }

            await SaveLogsFromTxtFile(stdout, stderr, duration);

            // Если скрипт завершился успешно, выходим из цикла
            break;
        } catch (error) {
            console.error(`Попытка ${attempt} не удалась: ${error}`);
            errorLogs += error;

            // Если это была последняя попытка, выбрасываем ошибку
            if (attempt === maxRetries) {
                console.error('Скрипт завершился с ошибкой после 5 попыток');
                SaveLogsFromTxtFile("", "", 0);
                throw error;
            }
        }
    }




    // Сохраняет логи в текстовый файл, в папку Logs
    async function SaveLogsFromTxtFile(stdout, stderr, duration) {
        // Берём текущую дату
        const now = new Date();
        // Заменяем : на символы ⁚
        const formattedDate = now.toLocaleString('ru-RU', { hour12: false }).replace(/:/g, '⁚');
        const logDir = path.join(__dirname, 'Logs');

        // Создаём папку Logs, если её нет
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        // Устанавливаем имя и путь для создания этого файла
        const logFileName = `LoadingLog_${formattedDate}.txt`;
        const logFilePath = path.join(logDir, logFileName);

        // Добавляю ошибки, которые возникли в результате запуска скрипта
        stdout = errorLogs + stdout;

        const logData = `
        Сканирование завершено: 1_Scanning.js завершился
        Лог этого скрипта: ${stdout}
        ${stderr ? `Ошибки этого скрипта: ${stderr}` : ''}
        
        Время выполнения сканирования: ${duration > 120 ? (duration / 60).toFixed(1) + 
        ' минут' : duration.toFixed(0) + ' секунд'}
        `;

        // Записываем лог в файл
        fs.writeFileSync(logFilePath, logData.trim());

        console.log(`Лог сохранён в файл: ${logFilePath}`);
    }





})();







































































  // //
  // // Формирует UID для каждой записи
  // //

  // // UID = Уникальный id

  // for(let i = 0; i < resultAllBetsArray.length; i++) {


  // }





































