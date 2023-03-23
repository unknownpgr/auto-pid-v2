#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    // Friction proportional to velocity
    float friction = atof(argv[1]);
    float input;

    while (scanf("%f", &input) != EOF)
    {
        // Apply friction. Note that the input value can be negative.
        input -= friction * input;
        printf("%f", input);
    }
}