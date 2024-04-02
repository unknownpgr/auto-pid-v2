main.o: src/main.c $(wildcard modules/*.h) $(wildcard include/*.h)
	gcc src/main.c -o main.o -Imodules -Iinclude

clean:
	rm -f main.o