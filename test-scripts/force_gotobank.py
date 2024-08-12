import time
import requests

route = 'balance'
host  = 'http://localhost:4000'
headers = {'authorization': 'X4ReAqOkgq8am0MgWPyZckjgYcykIYIA'}
json = {}

while True:
    n = 5
    start = time.time()
    for _ in range(n):
        requests.get(host + f'/api/{route}', headers=headers, json=json)
    
    print(round(n / (time.time() - start), 3), end='\r')