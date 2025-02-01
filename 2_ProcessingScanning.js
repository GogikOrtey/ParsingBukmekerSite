const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);


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

    } catch (error) {
        console.error(`exec error: ${error}`);
    }
})();




















// Проверить на обработку ошибок

// Добавить выгрузку логов в текстовый файл, каждый раз




















































  // //
  // // Формирует UID для каждой записи
  // //

  // // UID = Уникальный id

  // for(let i = 0; i < resultAllBetsArray.length; i++) {


  // }





































