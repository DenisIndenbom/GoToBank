# Документация

API банка позволяет запрашивать средства у пользователя по номеру счета и отправлять средства другим пользователям. Для совершения этих операций Вам понадобится торговый токен, узнать который можно в личном кабинете на сайте.

Взаимодействие с банком происходит по протоколу HTTPS. В случае успеха операции возвращается код ответа **200**, в иных случаях возможны коды **400**, **404**, **422**, а тело ответа содержит JSON с описанием ошибки.

## Авторизация

**Важно:** для работы с API токен cчёта должен храниться в заголовке запроса.

Пример JSON запроса
```json
{
    "header": 
    {
        "authorization": "<токен счёта>"
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
**Возращаемые параметры**
```json
{
    "state": "success",
    "transaction": 
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
**Возращаемые параметры**
```json
{
    "state": "success",
    "transaction": 
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
**Возращаемые параметры**
```json
{
    "state":"success",
    "status": "done"
}
```
**Статусы подтверждения и их значения**:
- `done` - Транзакция совершена успешна
- `cancelled` - Транзакция была отменена из-за нехватки средств или истечения срока действия кода подтверждения
- `blocked` - Транзакция была отменена из-за превышения количества попыток подтверждения
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
    "code": "<код ошибки>",
    "error": "<сообщение об ошибке>"
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
