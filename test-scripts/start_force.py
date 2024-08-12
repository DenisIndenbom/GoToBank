import subprocess
import threading

def func(main):
    expression = ["py", "force_gotobank.py"]
    if not main:
        subprocess.call(expression, stdout=subprocess.DEVNULL)
    else:
        subprocess.call(expression)
    
def thread_func(main):
    def wrapper():
        return func(main)
    
    return wrapper
    
for i in range(50):
    threading.Thread(target=thread_func(i==0), args=()).start()