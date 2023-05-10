const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();

app.use(express.json());

const customers = [];

// app.use(express.json());

// app.get("/courses", (req, res) => {
//     const query = req.query;
//     console.log(query);
//     return res.json(["Curso 1", "Curso 2", "Curso 3", "Curso 4"])
// })

// app.post("/courses", (req, res) => {
//     const body = req.body;
//     console.log(body);
//     return res.json(["Curso 1", "Curso 2", "Curso 3", "Curso 4", "Curso 5"])
// })

// app.put("/courses/:id", (req, res) => {
//     const { id } = req.params;
//     console.log(id);
//     return res.json(["Curso 111", "Curso 2", "Curso 3", "Curso 4"])
// })

// app.patch("/courses/:id", (req, res) => {
//     return res.json(["Curso 111", "Curso 222", "Curso 3", "Curso 4"])
// })

// app.delete("/courses/:id", (req, res) => {
//     return res.json(["Curso 111", "Curso 222", "Curso 4"])
// });
//

function verifyIfExistsAccountCPF(req, res, next) {
    // Função Middleware
    const { cpf } = req.headers;
    const customer = customers.find(customer => customer.cpf === cpf);

    if (!customer) {
        return res.status(404).json({ error: "Customer Not Found." })
    }

    req.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}



app.post('/account', (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    );

    if (customerAlreadyExists) {
        return res.status(400).json({ error: "Customer already exists!" })
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: [],
    });

    return res.status(201).send();
});


app.get('/statement', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    return res.json(customer.statement)
});


app.post('/deposit', verifyIfExistsAccountCPF, (req, res) => {
    const { description, amount } = req.body;
    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return res.status(201).send();
});


app.post('/withdraw', verifyIfExistsAccountCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return res.status(400).json({ error: "Insufficient funds!" })
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return res.status(201).send();
});


app.get('/statement/date', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(
        (statement) => 
            statement.created_at.toDateString() ===
            new Date(dateFormat).toDateString()
    );

    return res.json(statement);
})


app.put('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name  = name;

    return res.status(201).send();
});


app.get('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer);
});


app.delete('/account', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    //splicee
    customers.splice(customer, 1);

    return res.status(200).json({customers});
});


app.get('/balance', verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const balance = getBalance(customer.statement);

    return res.json(balance);
});

app.listen(3333);
