import * as SQLite from 'expo-sqlite';


const db = SQLite.openDatabase('SelectSwitch.db')

export const createList = (listName, listType, repeatResults, storeResults) => {
    return new Promise((resolve, reject) => {
        db.transaction((txn) => {
            txn.executeSql(`INSERT INTO lists (listName,listType,repeatResults,storeResults) VALUES(?,?,?,?)`,
                [listName, listType, repeatResults, storeResults],
                (_, result) => {
                    resolve(result)
                    console.log('Data Inserted')
                },
                (_, err) => {
                    reject(err)
                    console.log(err)
                }
            )
        })
    })
}

export const updateList = (listName, id) => {
    return new Promise((resolve, reject) => {
        db.transaction((txn) => {
            txn.executeSql(`UPDATE lists SET listName=? where id=?`,
                [listName, id],
                (_, result) => {
                    resolve(result)
                    console.log('Data Inserted')
                },
                (_, err) => {
                    reject(err)
                    console.log(err)
                }
            )
        })
    })
}