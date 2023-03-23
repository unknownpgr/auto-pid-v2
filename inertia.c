#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    float inertia = atof(argv[1]);

    float input;
    float velocity = 0;
    while (scanf("%f", &input) != EOF)
    {
        velocity += input / inertia;
    }
}