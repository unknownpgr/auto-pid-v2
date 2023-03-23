#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    // Friction proportional to square of velocity
    float friction = atof(argv[1]);
    float input;

    while (scanf("%f", &input) != EOF)
    {
        // Apply friction. Note that the input value can be negative.
        input -= friction * input * input;
        printf("%f", input);
    }
}