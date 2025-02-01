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

const { exec } = require('child_process');

exec('node 1_Scanning.js', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`Лог этого скрипта: ${stdout}`);
    console.error(`Ошибки этого сприпта: ${stderr}`);
    console.log('Сканирование завершено: 1_Scanning.js завершился');
});





























































  // //
  // // Формирует UID для каждой записи
  // //

  // // UID = Уникальный id

  // for(let i = 0; i < resultAllBetsArray.length; i++) {


  // }





































