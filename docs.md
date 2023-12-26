# Документация

API банка позволяет запрашивать средства у пользователя по номеру счета и отправлять средства другим пользователям. Для совершения этих операций Вам понадобится торговый токен, узнать который можно в личном кабинете на сайте.

Взаимодействие с банком происходит по протоколу HTTPS. В случае успеха операции возвращается код ответа **200**, в иных случаях возможны коды **400**, **404**, **422**, а тело ответа содержит JSON с описанием ошибки.

---

## Авторизация

**Важно:** для работы с API токен cчёта должен храниться в заголовке запроса.

Пример JSON запроса
```json
{
    "header": 
    {
        "authorization": "token" // Токен счёта
    }
}
```
Пример запроса на **python**
```python
import requests

host = '<bank_host>'

headers = {'authorization': ТОКЕН}
json = {}

res = requests.post(host + '/api/', headers=headers, json=json)
```

## Информация об аккаунте
```js
GET /api/account
```
**Возвращаемые  параметры**
```json
{
    "state": "success",
    "account": 
    {
        "id": 1, // ID аккаунта
        "user_id": 1, // ID пользовотеля в GoToID
        "created_at": "2023-12-11 00:00:00" // Дата создания аккаунта
    }
}
```

Пример запроса на **python**
```python
import requests

host = '<bank_host>'

headers = {'authorization': ТОКЕН}

res = requests.get(host + '/api/account', headers=headers)

print(res.status_code)
print(res.json())
```

## Баланс
```js
GET /api/balance
```
**Возвращаемые  параметры**
```json
{
    "state": "success",
    "balance": 0 // Сумма на счету, валюта готубли
}
```

Пример запроса на **python**
```python
import requests

host = '<bank_host>'

headers = {'authorization': ТОКЕН}

res = requests.get(host + '/api/balance', headers=headers)

print(res.status_code)
print(res.json())
```

## Коды подтверждения
```js
GET /api/codes
```
**Возвращаемые  параметры**
```json
{
    "state": "success",
    "codes": 
    [
     {
        "code": // Структура "Код подтверждения"
        { 
            "transaction_id": 1, // ID транзакции
            "code": 1111, // Код подтверждения
            "expires_at": "2023-12-11 00:00:00", // Дата истечения действия кода
            "attempts": 3 // Кол-во оставшихся попыток
        }
     },
     // и т.д
    ]
}
```

Пример запроса на **python**
```python
import requests

host = '<bank_host>'

headers = {'authorization': ТОКЕН}

res = requests.get(host + '/api/account', headers=headers)

print(res.status_code)
print(res.json())
```

## Транзакция
```js
GET /api/transaction?id=1 // ID запрашиваемой транзакции
```

**Важно**: данный метод возвращает транзакцию **относящуюся к вашему аккаунту**

**Возвращаемые  параметры**
```json
{
    "state": "success",
    "transaction": // Структура "Транзакция"
    {
        "id": 1, // ID транзакции          
        "from_id": 1, // Откуда (ID счёта отправителя)    
        "to_id": 2, // Куда (ID счёта получателя)  
        "amount": 10, // Размер переводимой суммы    
        "created_at": "2023-12-11 00:00:00", // Дата и время проведения транзакции
        "type": "<тип>", // Тип транзакции
        "description": "Some description", // Описание транзакции
        "status": "<статус>" // Статус транзакции
    }
}
```

Пример запроса на **python**
```python
import requests

host = '<bank_host>'

headers = {'authorization': ТОКЕН}
transaction_id = ID ТРАНЗАКЦИИ

res = requests.get(host + f'/api/transaction?id={transaction_id}', headers=headers)

print(res.status_code)
print(res.json())
``` 

## Перевод средств
```js
POST /api/transfer
```
**Входные параметры**
```json
{
    "account_id": 2, // ID счёта получателя
    "amount": 10, // Размер переводимой суммы
    "description": "Some description" // Описание транзакции
}
```
**Возвращаемые  параметры**
```json
{
    "state": "success",
    "transaction": // Структура "Транзакция"
    {
        "id": 1, // ID транзакции          
        "from_id": 1, // Откуда (ID счёта отправителя)    
        "to_id": 2, // Куда (ID счёта получателя)  
        "amount": 10, // Размер переводимой суммы    
        "created_at": "2023-12-11 00:00:00", // Дата и время проведения транзакции
        "type": "transfer", // Тип транзакции (перевод)
        "description": "Some description", // Описание транзакции
        "status": "done" // Статус транзакции
    }
}
```

Пример запроса на **python**
```python
import requests

host = '<bank_host>'

headers = {'authorization': ТОКЕН}

json = {
    'account_id': НОМЕР СЧЁТА ПОЛУЧАТЕЛЯ,
    'amount': СУММА,
    'description': ОПИСАНИЕ
}

res = requests.post(host + '/api/transfer', headers=headers, json=json)

print(res.status_code)
print(res.json())
```

## Запрос оплаты
```js
POST /api/payment
```
**Входные параметры**
```json
{
    "account_id": 2, // ID счёта покупателя
    "amount": 10, // Сумма покупки
    "description": "Some description" // Описание транзакции
}
```
**Возвращаемые  параметры**
```json
{
    "state": "success",
    "transaction": // Структура "Транзакция"
    {
        "id": 1, // ID транзакции          
        "from_id": 2, // Откуда (ID счёта покупателя)    
        "to_id": 1, // Куда (ID счёта продовца)  
        "amount": 10, // Размер переводимой суммы    
        "created_at": "2023-12-11 00:00:00", // Дата и время проведения транзакции
        "type": "payment", // Тип транзакции (перевод)
        "description": "Some description", // Описание транзакции
        "status": "pending" // Статус транзакции
    }
}
```

Пример запроса на **python**
```python
import requests

host = '<bank_host>'

headers = {'authorization': ТОКЕН}

json = {
    'account_id': НОМЕР СЧЁТА ПОКУПАТЕЛЯ,
    'amount': СУММА,
    'description': ОПИСАНИЕ
}

res = requests.post(host + '/api/pyment', headers=headers, json=json)

print(res.status_code)
print(res.json())
```

## Подтверждение оплаты
```js
POST /api/verify
```
**Входные параметры**
```json
{
    "transaction_id": 2, // ID транзакции
    "code": 1111, // Код подтверждения (от 1111 до 9999)
}
```
**Возвращаемые  параметры**
```json
{
    "state": "success",
    "status": "done" // Статус подтверждения
}
```
**Статусы подтверждения и их значения**:
- `done` - Транзакция совершена успешна
- `blocked` - Транзакция была отменена из-за нехватки средств, или истечения срока действия кода подтверждения, или превышения количества попыток подтверждения
- `incorrect_code` - Код подтверждения неверен
  
Пример запроса на **python**
```python
import requests

host = '<bank_host>'

headers = {'authorization': ТОКЕН}

json = {
    'transaction_id': ID ТРАНЗАКЦИИ,
    'code': КОД ПОДТВЕРЖДЕНИЯ
}

res = requests.post(host + '/api/verify', headers=headers, json=json)

print(res.status_code)
print(res.json())
```

## Опсиание ошибок
В случае ошибки возможны коды **400**, **404**, **422**, а тело ответа содержит JSON с описанием ошибки.

**Ответ в случае ошибки**
```json
{
    "state": "error",
    "code": "<код ошибки>", // Код ошибки
    "error": "<сообщение об ошибке>" // Подробное описание ошибки
}
```
**Коды ошибок:**
- `not_found` - Такой маршрут не найден 
- `invalid_args` - Переданы некорректные аргументы
- `invalid_transaction` - Транзакция невозможна 
- `invalid_transaction_id` - Некорректный ID транзакции
- `transaction_not_exist` - Транзакции не существует
- `transaction_cancelled` - Транзакция отменена
- `transaction_blocked` - Транзакция заблокирована
- `transaction_finished` - Транзакция уже завершена
- `account_not_exist` - Аккаунта не существует
- `account_blocked` - Аккаунт заблокирован
- `insufficient_funds` - Недостаточно средств


---

## Структуры
В GoToBank API есть две основные структуры: **транзакция** и **код подтверждения**.

### Транзакция
**Транзакция** - это операция, которая включает в себя перевод средств между счетами или выполнение других финансовых операций.

**Параметры тразакции**
- `id` - ID транзакции
- `from_id` - ID стороны отправителя
- `to_id` - ID стороны получателя
- `amount` - Сумма производимой транзакции
- `created_at` - Дата создания
- `type` - Тип производимой транзакции (`transfer`, `payment`, `emission`, `commission`)
- `description` - Описание транзакции
- `status` - Статут производимой транзакции (`done`, `pending`, `blocked`, `cancelled`)

**Типы**
- `transfer` - Перевод из счёта A в счёт B
- `payment` - Оплата за услугу/товар - перевод из счёта A в счёт B
- `emission` - Пополнение счёта A из вне
- `commission` - Комиссия или штраф за операции

**Статусы**
- `done` - Транзакция совершена
- `pending` - Транзакция на рассмотрении
- `blocked` - Транзакция заблокирована

### Код подтверждения
**Код подтверждения** - это код, который служит для подтверждения платёжной транзакции. У кода есть **дата истечения** и **кол-во попыток** на подтверждение. Это нужно для обеспечение безопасноти подтверждения платёжной транзакции.

**Параметры кода подтверждения**
- `transaction_id` - ID транзакции
- `code` - Код подтверждения (число от 1111 до 9999)
- `expires_at` - Дата истечения действия кода
- `attempts` - Кол-во оставшихся попыток