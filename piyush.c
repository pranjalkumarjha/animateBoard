#include <stdio.h>
#include <stdlib.h>
#include <sys/msg.h>
#include <sys/shm.h>
#include <errno.h>
#include <math.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <time.h>

#define authorizationset_length 6
#define maximum_solver_processes 100
#define maximum_chances 100
#define people_limit 1000
#define maximum_latest_reqs 30
#define maximum_lifts 100
#define maximum_storeys 300
#define lift_limit 20
#define authorizationset "abcdef"
int ar[20] = {0};
typedef struct PassengerRequest
{
    int requestId;
    int startFloor;
    int requestedFloor;
} PassengerRequest;

typedef struct TurnChangeResponse
{
    long mtype;
    int turnNumber;
    int newPassengerRequestCount;
    int errorOccurred;
    int finished;

} TurnChangeResponse;
typedef struct MainSharedMemory
{
    char authStrings[maximum_lifts][lift_limit + 1];
    char elevatorMovementInstructions[maximum_lifts];
    PassengerRequest newPassengerRequests[maximum_latest_reqs];
    int elevatorFloors[maximum_lifts];
    int droppedPassengers[people_limit];

    int pickedUpPassengers[people_limit][2];
} MainSharedMemory;

typedef struct SolverRequest
{
    long mtype;
    int elevatorNumber;
    char authStringGuess[lift_limit + 1];

} SolverRequest;

typedef struct SolverResponse
{
    long mtype;
    int guessIsCorrect;
} SolverResponse;
typedef struct PassengerState
{

    int requestedFloor;
    int inlift;
    int liftAllocated;
    int requestId;
    int startFloor;

} PassengerState;

typedef struct ElevatorState
{
    int currentFloor;
    char direction;

    int passengersInElevator[lift_limit];
    int passengerDestinations[lift_limit];
    int passengerCount;

} ElevatorState;
typedef struct TurnChangeRequest

{
    long mtype;
    int droppedPassengersCount;
    int pickedUpPassengersCount;
} TurnChangeRequest;

int N, K, M, T;
key_t sharedMemoryKey, mainProcessKey, solverQueueKeys[maximum_solver_processes];
int shmId, mainQueueId, solverQueueIds[maximum_solver_processes];
MainSharedMemory *sharedMem;

ElevatorState elevators[maximum_lifts];
PassengerState passengers[people_limit];
int totalPassengers = 0;

// void  InputFileReader();
// void initializeIPC();
void solve();
void obtainAuthString(int elevatorNumber, int passengerCount, char *authString);
int generateAuthString(int peopleInLift, char *authString, int solverId);

// int intPow(int base, int exponent)
// {
//     int result = 1;
//     for (int i = 0; i < exponent; ++i)
//     {
//         result *= base;
//     }
//     return result;
// }
int expcalc(int subscript, int superscript)
{
    // subscript case: Any number to the power of 0 is 1
    if (superscript == 0)
    {
        return 1;
    }
    // If the superscript is negative
    if (superscript < 0)
    {
        // Optional: Handle negative superscripts
        // For integer return, it could return 0 or handle it as error
        return 0; // Simplified error handling
    }
    // Recursive case: Divide the problem into smaller subproblems
    int halfPow = expcalc(subscript, superscript / 2);
    if (superscript % 2 == 0)
    {
        return halfPow * halfPow; // Even superscript
    }
    else
    {
        return subscript * halfPow * halfPow; // Odd superscript
    }
}

void InputFileReader()
{ // printf("infr");
    int line;
    FILE *file = fopen("input.txt", "r");
    // if (!file)
    // {
    //     perror("Failed to open input.txt");
    //     exit(1);
    // }
    fscanf(file, "%d", &line);
    N = line;
    fscanf(file, "%d", &line);
    K = line;
    fscanf(file, "%d", &line);
    M = line;
    fscanf(file, "%d", &line);
    T = line;
    fscanf(file, "%d", &line);
    sharedMemoryKey = (key_t)line;
    fscanf(file, "%d", &line);
    mainProcessKey = (key_t)line;
    int i = 0;
    while (i < M)
    {
        fscanf(file, "%d", &line);
        solverQueueKeys[i] = (key_t)line;
        i++;
    }
    fclose(file);
    // printf("Floors: %d Solvers: %d Elevatros: %d Turn no of last req: %d ", K, M, N, T);

    // ipcinit

    shmId = shmget(sharedMemoryKey, sizeof(MainSharedMemory), 0666);
    // if (shmId < 0)
    // {
    //     perror("Failed to get shared memory");
    //     exit(1);
    // }
    sharedMem = (MainSharedMemory *)shmat(shmId, NULL, 0);
    // if (sharedMem == (void *)-1)
    // {
    //     perror("Failed to attach shared memory");
    //     exit(1);
    // }
    mainQueueId = msgget(mainProcessKey, 0666);
    // if (mainQueueId < 0)
    // {
    //     perror("Failed to get main message queue");
    //     exit(1);
    // }
    i = 0;
    while (i < M)
    {
        solverQueueIds[i] = msgget(solverQueueKeys[i], 0666);
        // if (solverQueueIds[i] < 0)
        // {
        //     perror("Failed to get solver message queue");
        //     exit(1);
        // }
        i++;
    }
    // printf("ended read");
}

//  void initializeIPC()
// {
//     shmId = shmget(sharedMemoryKey, sizeof(MainSharedMemory), 0666);
//     // if (shmId < 0)
//     // {
//     //     perror("Failed to get shared memory");
//     //     exit(1);
//     // }
//     sharedMem = (MainSharedMemory *)shmat(shmId, NULL, 0);
//     // if (sharedMem == (void *)-1)
//     // {
//     //     perror("Failed to attach shared memory");
//     //     exit(1);
//     // }
//     mainQueueId = msgget(mainProcessKey, 0666);
//     // if (mainQueueId < 0)
//     // {
//     //     perror("Failed to get main message queue");
//     //     exit(1);
//     // }
//     int i=M-1;
//     while(i)
//     {
//         solverQueueIds[i] = msgget(solverQueueKeys[i], 0666);
//         // if (solverQueueIds[i] < 0)
//         // {
//         //     perror("Failed to get solver message queue");
//         //     exit(1);
//         // }
//         i--;
//     }
// }

// void cleanup()
// {
//     if (shmdt(sharedMem) == -1)
//     {
//         perror("Failed to detach shared memory");
//     }
// }

void obtainAuthString(int elevatorNumber, int passengerCount, char *authString)
{
    static int solverIndex = 0;
    int solverId = solverQueueIds[solverIndex % M];
    solverIndex++;
    SolverRequest setTarget;
    setTarget.mtype = 2;
    setTarget.elevatorNumber = elevatorNumber;
    setTarget.authStringGuess[0] = '\0';
    msgsnd(solverId, &setTarget, sizeof(SolverRequest) - sizeof(long), 0);
    // if (msgsnd(solverId, &setTarget, sizeof(SolverRequest) - sizeof(long), 0) == -1)
    // {
    //     perror("Failed to send set target to solver");
    //     exit(1);
    // }
    char authGuess[lift_limit + 1];
    generateAuthString(passengerCount, authGuess, solverId);
    strcpy(authString, authGuess);
    // if (generateAuthString(passengerCount, authGuess, solverId))
    // {
    //     strcpy(authString, authGuess);
    // }
    // else
    // {
    //     f//printf(stderr, "Failed to obtain auth string for elevator %d ", elevatorNumber);
    //     exit(1);
    // }
}

int generateAuthString(int peopleInLift, char *authString, int solverId)
{

    char currguess[lift_limit + 1];
    int i = 0;
    if (i >= 0)
    {
        int limit = (int)expcalc(authorizationset_length, peopleInLift);
        while (i < limit)
        {
            int line = i;

            int k = 0;
            if (k >= 0)
                while (k < peopleInLift)
                {
                    currguess[k] = authorizationset[line % authorizationset_length];
                    line = line / authorizationset_length;
                    k++;
                }

            currguess[peopleInLift] = '\0';
            SolverRequest guess;
            guess.mtype = 3;
            guess.elevatorNumber = 0;
            strcpy(guess.authStringGuess, currguess);
            msgsnd(solverId, &guess, sizeof(SolverRequest) - sizeof(long), 0);
            // if (msgsnd(solverId, &guess, sizeof(SolverRequest) - sizeof(long), 0) == -1)
            // {
            //     perror("Failed to send guess to solver");
            //     exit(1);
            // }
            SolverResponse response;
            msgrcv(solverId, &response, sizeof(SolverResponse) - sizeof(long), 4, 0);
            // if (msgrcv(solverId, &response, sizeof(SolverResponse) - sizeof(long), 4, 0) == -1)
            // {
            //     perror("Failed to receive from solver");
            //     exit(1);
            // }
            while (response.guessIsCorrect)
            {
                strcpy(authString, currguess);
                return 1;
            }
            i++;
        }
    }
    return 0;
}
// void pickUpPassengerOnTheWay(int currentPassengerIndex, int elevatorIndex)
// {
//     // (currentPassengerIndex)passenger Index taken from the waiting list
//     ElevatorState *elevator = &elevators[elevatorIndex];
//     PassengerState *passenger = &passengers[currentPassengerIndex];
//     passenger->inlift = elevatorIndex;
// }
void solve()
{
    int finished = 0;
    int turnNumber = 0;
    // int turnNumber = 0;

    // printf("here");
    while (!finished)
    {
        // printf("infinite");
        TurnChangeResponse response;
        // msgrcv(mainQueueId, &response, sizeof(TurnChangeResponse) - sizeof(long), 2, 0);
        // printf("infinite2");

        if (msgrcv(mainQueueId, &response, sizeof(TurnChangeResponse) - sizeof(long), 2, 0) == -1)
        {
            perror("Failed to receive from helper");
            exit(1);
        }

        if (response.errorOccurred)
        {
            // printf(stderr, "An error occurred in the helper process. ");
            break;
        }
        // printf("%d %d %d",response.finished,response.errorOccurred,response.newPassengerRequestCount);
        if (response.finished)
        {
            finished = 1;
            // printf("response");
            break;
        }
        // printf("infinite3");

        // turnNumber = response.turnNumber

        int pickedPassengerThisTurn = 0;
        int droppedPassengerThisTurn = 0;

        int a = 0;
        while (a < response.newPassengerRequestCount)
        {
            PassengerRequest person = sharedMem->newPassengerRequests[a];
            passengers[totalPassengers].requestId = person.requestId;
            if (ar[0] == 1)
            {
                printf("error check 1");
            }
            passengers[totalPassengers].startFloor = person.startFloor;
            passengers[totalPassengers].requestedFloor = person.requestedFloor;
            if (ar[0] == 1)
            {
                printf("error check 1");
            }
            passengers[totalPassengers].inlift = -1;
            passengers[totalPassengers].liftAllocated = 0;
            totalPassengers++;
            a++;
        }
        // printf("infinite4");

        int moveIndex = 0;
        while (moveIndex < N)
        {
            sharedMem->authStrings[moveIndex][0] = '\0';
            sharedMem->elevatorMovementInstructions[moveIndex] = 's';

            moveIndex++;
        }
        // printf("infinite5");

        memset(sharedMem->pickedUpPassengers, 0, sizeof(sharedMem->pickedUpPassengers));
        memset(sharedMem->droppedPassengers, 0, sizeof(sharedMem->droppedPassengers));

        int unallocatedPassengers[people_limit];
        int unallocatedPassengersCount = 0;
        int c = 0;
        while (c < totalPassengers)
        {
            if (!passengers[c].liftAllocated && passengers[c].inlift == -1)
            {
                unallocatedPassengers[unallocatedPassengersCount++] = c;
            }
            c++;
        }
        // printf("infinite6");
        if (ar[0] == 1)
        {
            printf("error check 1");
        }
        int passengerLimitPerElevator = 5;
        int i = 0;
        while (i < N) // selecting every elevator one by one
        {
            if (ar[0] == 1)
            {
                printf("error check 1");
            }

            ElevatorState *elevator = &elevators[i];
            int initialCount = elevator->passengerCount;

            if (elevator->passengerCount == 0 && unallocatedPassengersCount > 0)
            {
                if (ar[0] == 1)
                {
                    printf("error check 1");
                }
                int closestPassenger = K + 1;
                int passengerIndex = -1;
                for (int j = 0; j < unallocatedPassengersCount; ++j)
                {
                    if (ar[0] == 1)
                    {
                        printf("error check 1");
                    }
                    int currentPassengerIndex = unallocatedPassengers[j];
                    int passengerDistance = abs(elevator->currentFloor - passengers[currentPassengerIndex].startFloor);
                    if (ar[0] == 1)
                    {
                        printf("error check 1");
                    }
                    if (passengerDistance < closestPassenger)
                    {
                        closestPassenger = passengerDistance;
                        passengerIndex = currentPassengerIndex;
                    }
                }
                if (ar[0] == 1)
                {
                    printf("error check 1");
                }

                if (passengerIndex != -1)
                {
                    PassengerState *passenger = &passengers[passengerIndex];
                    if (elevator->currentFloor < passenger->startFloor)
                    {
                        sharedMem->elevatorMovementInstructions[i] = 'u';
                        elevator->direction = 'u';
                    }
                    else if (elevator->currentFloor > passenger->startFloor)
                    {
                        sharedMem->elevatorMovementInstructions[i] = 'd';
                        elevator->direction = 'd';
                    }
                    else
                    {
                        sharedMem->elevatorMovementInstructions[i] = 's';
                        if (ar[0] == 1)
                        {
                            printf("error check 1");
                        }
                        if (elevator->passengerCount < passengerLimitPerElevator && passenger->inlift == -1)
                        {
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            sharedMem->pickedUpPassengers[pickedPassengerThisTurn][0] = passenger->requestId;
                            sharedMem->pickedUpPassengers[pickedPassengerThisTurn][1] = i;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            pickedPassengerThisTurn++;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            passenger->inlift = i;
                            elevator->passengersInElevator[elevator->passengerCount] = passenger->requestId;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            elevator->passengerDestinations[elevator->passengerCount] = passenger->requestedFloor;
                            elevator->passengerCount++;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                        }
                        if (ar[0] == 1)
                        {
                            printf("error check 1");
                        }
                    }
                }
            }
            else if (elevator->passengerCount > 0)
            {
                int closestPassenger = K + 1;
                int targetFloor = elevator->currentFloor;
                for (int j = 0; j < elevator->passengerCount; ++j)
                {
                    if (ar[0] == 1)
                    {
                        printf("error check 1");
                    }
                    int destination = elevator->passengerDestinations[j];
                    int passengerDestinationDistance = abs(elevator->currentFloor - destination);
                    if (passengerDestinationDistance < closestPassenger)
                    {
                        if (ar[0] == 1)
                        {
                            printf("error check 1");
                        }
                        closestPassenger = passengerDestinationDistance;
                        targetFloor = destination;
                    }
                }
                // pickup passengers who's (start floor == current elevator floor) and (its allocated to this elevator)
                

                if (elevator->currentFloor < targetFloor)
                {
                    // pickup passengers in the same direction (requestedFloor > currentFloor && startfloor >= currentFloor && person is in waiting)
                    // do this to designate elevator  (passenger->inlift = i;)

                    sharedMem->elevatorMovementInstructions[i] = 'u';

                    for (int j = 0; j < unallocatedPassengersCount; ++j)
                    {
                        if (ar[0] == 1)
                        {
                            printf("error check 1");
                        }
                        if (elevator->passengerCount == passengerLimitPerElevator)
                        {
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            break;
                        }
                        int currentPassengerIndex = unallocatedPassengers[j];
                        if (passengers[currentPassengerIndex].startFloor == elevator->currentFloor && passengers[currentPassengerIndex].requestedFloor > elevator->currentFloor )
                        {
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            sharedMem->pickedUpPassengers[pickedPassengerThisTurn][0] = passengers[currentPassengerIndex].requestId;
                            sharedMem->pickedUpPassengers[pickedPassengerThisTurn][1] = i;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            pickedPassengerThisTurn++;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            passengers[currentPassengerIndex].inlift = i;
                            elevator->passengersInElevator[elevator->passengerCount] = passengers[currentPassengerIndex].requestId;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            elevator->passengerDestinations[elevator->passengerCount] = passengers[currentPassengerIndex].requestedFloor;
                            elevator->passengerCount++;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                        }
                    }

                    elevator->direction = 'u';
                }
                else if (elevator->currentFloor > targetFloor)
                {
                    // pickup passengers in the same direction (requestedFloor > currentFloor && startfloor <= currentFloor && person is in waiting
                    for (int j = 0; j < unallocatedPassengersCount; ++j)
                    {
                        if (elevator->passengerCount == passengerLimitPerElevator)
                        {
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            break;
                        }
                        int currentPassengerIndex = unallocatedPassengers[j];
                        if (passengers[currentPassengerIndex].startFloor == elevator->currentFloor && passengers[currentPassengerIndex].requestedFloor < elevator->currentFloor )
                        {
                           if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            sharedMem->pickedUpPassengers[pickedPassengerThisTurn][0] = passengers[currentPassengerIndex].requestId;
                            sharedMem->pickedUpPassengers[pickedPassengerThisTurn][1] = i;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            pickedPassengerThisTurn++;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            passengers[currentPassengerIndex].inlift = i;
                            elevator->passengersInElevator[elevator->passengerCount] = passengers[currentPassengerIndex].requestId;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            elevator->passengerDestinations[elevator->passengerCount] = passengers[currentPassengerIndex].requestedFloor;
                            elevator->passengerCount++;
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                        }
                    }
                    sharedMem->elevatorMovementInstructions[i] = 'd';
                    elevator->direction = 'd';
                }
                else
                {
                    sharedMem->elevatorMovementInstructions[i] = 's';
                    for (int j = 0; j < elevator->passengerCount;)
                    {
                        if (elevator->passengerDestinations[j] == elevator->currentFloor)
                        {
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            int requestId = elevator->passengersInElevator[j];
                            sharedMem->droppedPassengers[droppedPassengerThisTurn++] = requestId;

                            for (int p = 0; p < totalPassengers; ++p)
                            {
                                if (ar[0] == 1)
                                {
                                    printf("error check 1");
                                }
                                if (passengers[p].requestId == requestId)
                                {
                                    passengers[p].liftAllocated = 1;
                                    passengers[p].inlift = -1;
                                    break;
                                }
                            }

                            for (int k = j; k < elevator->passengerCount - 1; ++k)
                            {
                                elevator->passengersInElevator[k] = elevator->passengersInElevator[k + 1];
                                elevator->passengerDestinations[k] = elevator->passengerDestinations[k + 1];
                            }
                            if (ar[0] == 1)
                            {
                                printf("error check 1");
                            }
                            elevator->passengerCount--;
                        }
                        else
                        {
                            j++;
                        }
                    }
                }
            }
            if (initialCount != 0)
            {
                printf(initialCount);
                char authString[lift_limit + 1];
                if (ar[0] == 1)
                {
                    printf("error check 1");
                }
                obtainAuthString(i, initialCount, authString);
                if (ar[0] == 1)
                {
                    printf("error check 1");
                }
                strcpy(sharedMem->authStrings[i], authString);
            }
            i++;
        }
        // printf("infinite7");
        // comment this out last
        // for (int i = 0; i < N; ++i)
        // {
        //     if (sharedMem->elevatorMovementInstructions[i] != 's' && elevators[i].passengerCount > 0)
        //     {
        //         char authString[lift_limit + 1];
        //         obtainAuthString(i, elevators[i].passengerCount, authString);
        //         strcpy(sharedMem->authStrings[i], authString);
        //     }
        // }

        TurnChangeRequest request;
        request.mtype = 1;
        request.droppedPassengersCount = droppedPassengerThisTurn;
        request.pickedUpPassengersCount = pickedPassengerThisTurn;

        if (ar[0] == 1)
        {
            printf("error check 1");
        }
        msgsnd(mainQueueId, &request, sizeof(TurnChangeRequest) - sizeof(long), 0);

        for (int i = 0; i < N; ++i)
        {
            if (sharedMem->elevatorMovementInstructions[i] == 'u')
            {
                elevators[i].currentFloor++;
            }
            else if (sharedMem->elevatorMovementInstructions[i] == 'd')
            {
                elevators[i].currentFloor--;
            }
        }
    }
}
int main()
{
    int arr[5] = {0, 0, 0, 0, 0};
    InputFileReader();
    if (arr[0] == 1)
    {
        printf("error here" );
    }
    for (int i = 0; i < N; ++i)
    {
        if (arr[1] == 1)
        {
            printf("error here" );
        }
        elevators[i].currentFloor = 0;
        elevators[i].direction = 's';
        elevators[i].passengerCount = 0;
    }
    // printf("after main for ");
    if (arr[2] == 1)
    {
        printf("error here" );
    }
    solve();
    if (arr[3] == 1)
    {
        printf("error here" );
    }
    // printf("last");
    shmdt(sharedMem);
    if (arr[4] == 1)
    {
        printf("error here" );
    }
    return 0;
}