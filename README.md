# Auto-PID

This project will suppose a new pid-control gain fiitting method.
The purpose of this project is to find the relationship between given system and the pid-control gain.
Because the property of control system can be found by input a Dirac pulse to the system, If we can find relationship between the response of the system and the pid-control gain, we can find the pid-control gain for any system.

To do this, I will implemnt a C program that simulates random system. This system will consist of chain of functions, including amplifier, integrator, differentiator, delay, and so on.
