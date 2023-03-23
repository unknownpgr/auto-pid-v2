#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    // Take static friction and kinetic friction from arguments
    float static_friction = atof(argv[1]);
    float kinetic_friction = atof(argv[2]);
    float input;

    while (scanf("%f", &input) != EOF)
    {
        // Apply friction. Note that the input value can be negative.
        if (input > static_friction)
        {
            input -= kinetic_friction;
        }
        else if (input < -static_friction)
        {
            input += kinetic_friction;
        }
        else
        {
            input = 0;
        }
        printf("%f", input);
    }
}