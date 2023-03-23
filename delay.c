#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    int timestep = atoi(argv[1]);
    float input;
    float buffer[timestep];
    int i = 0;
    while (i < timestep)
    {
        buffer[i] = 0;
        i++;
    }

    while (scanf("%f", &input) != EOF)
    {
        buffer[i % timestep] = input;
        printf("%f", buffer[(i + 1) % timestep]);
        i++;
    }
}