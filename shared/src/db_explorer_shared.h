#include <stdint.h>

void db_shared_init();
void db_shared_deinit();
void db_shared_register_postback_handler(void (*postbackHandle)(char *));
const char *db_shared_receive_message(const char *message);
void db_shared_free_message(char *);
