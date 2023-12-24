import os
import requests

host = 'http://localhost:4000'

def account():
    return requests.get(host + f'/api/account', headers=headers)

def balance():
    return requests.get(host + f'/api/balance', headers=headers)

def codes():
    return requests.get(host + f'/api/codes', headers=headers)

def transaction():
    return requests.get(host + f"/api/transaction?id={input('ID транзакции: ')}", headers=headers)

def transfer():
    json = {
        'account_id': int(input('ID получателя: ')),
        'amount': int(input('Сумма: ')),
        'description': input('Описание: ')
    }
    
    return requests.post(host + f'/api/transfer', headers=headers, json=json)

def payment():
    json = {
        'account_id': int(input('ID покупателя: ')),
        'amount': int(input('Сумма: ')),
        'description': input('Описание: ')
    }
    
    return requests.post(host + f'/api/payment', headers=headers, json=json)

def verify():
    json = {
        'transaction_id': int(input('ID транзакции: ')),
        'code': int(input('Код: '))
    }
    
    return requests.post(host + f'/api/verify', headers=headers, json=json)

def clear():
    os.system('cls')

headers = {'authorization': input('Введите токен счёта: ')}
operations = {
    'account': account,
    'balance': balance,
    'codes': codes,
    'transaction': transaction,
    'transfer': transfer,
    'payment': payment,
    'verify': verify,
    'clear': clear,
    'cls': clear,
    'exit': exit
}

while True:
    operation = input('Введите название операции: ')

    if operations.get(operation) is None:
        continue
    
    res = operations[operation]()
    
    if res is not None:
        print(res.status_code)
        print(res.json())