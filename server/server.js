require('dotenv').config();
const oracledb = require('oracledb');
const express = require('express');
const app = express();
const port = 5000;

app.use(express.json());


async function initialize() {

    try {

        await oracledb.createPool({
            user          : process.env.DB_USER,
            password      : process.env.DB_PASS,
            connectString : process.env.DB_STRING,
            poolIncrement : 0,
            poolMax       : 4,
            poolMin       : 4
        });
    }
    catch (err) {
        console.error(err);
    }
}


async function performOperation(operation) {
    let result;
    let connection;
    try {
        // Use the connection string copied from the cloud console
        // and stored in connstring.txt file from Step 2 of this tutorial
        connection = await oracledb.getConnection();
        result = await connection.execute(operation, {}, {
            autoCommit: true
        });
        
    }
    catch (err) {
        console.error(err);
    }
    finally {
        if (connection) {
            try {
                await connection.close();
            }
            catch (err) {
                console.error(err);
            }
        }
        return result;
    }
}

initialize();

app.get("/api", (req, res) => {
    const selectAllRows = `SELECT * FROM REACT.ACCOUNTS_NOTIFY WHERE EMAIL = '${req.query.email}'`; //Select query
    performOperation(selectAllRows).then((result) => {
        res.send(result.rows)
    }).catch((error) => {
        console.error(error);
    })
});


app.post("/api", (req, res) => {
    const row = req.body.row;
    const insertRowRequest = `INSERT INTO REACT.accounts_notify (email, class_name, class_sections, campus, ip_address) VALUES ('${row.email}', '${row.class_name.toUpperCase()}', '${row.class_sections}', '${row.campus}', '${req.headers['X-Forwarded-For']}')`; //Insert query
    performOperation(insertRowRequest).then((result) => {
        res.send({ message: "Insert sucessfull!" });
    }).catch((error) => {
        console.error(error);
    })

})

app.delete("/api", (req, res) => {


    performOperation(`SELECT * FROM REACT.accounts_notify WHERE id = ${req.query.id}`).then((result) => {
        if(req.query.email == result.rows[0][4]) {
            const deleteRowRequest = `DELETE FROM REACT.accounts_notify WHERE id = ${req.query.id}`; //Delete query
            performOperation(deleteRowRequest).then((deleteResult) => {
                res.send({ message: "Delete sucessfull!" });
            }).catch((error) => {
                console.error(error);
            })
        }  
    }).catch((error) => {
        console.error(error);
    })

})

app.listen(port, () => console.log(`Listening on port ${port}`));