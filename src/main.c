#include <stdio.h>
#include "system.h"
#include "identical.h"

float do_10_times(transfer_function_t transfer_function, float input)
{
    float output = input;
    for (int i = 0; i < 11; i++)
    {
        output = transfer_function(output, i);
    }
    return output;
}

int main()
{
    float input = 1.0;
    transfer_function_t func = identical;
    float output = do_10_times(func, input);
    printf("Output: %f\n", output);
    return 0;
}