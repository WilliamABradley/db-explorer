#include "pch.h"
//#include "example.h"
//#include <iostream>
//#include "pqxx/connection.hxx";
//#include "pqxx/nontransaction.hxx";
//
//namespace example
//{
//	int multiply(float a, float b)
//	{
//		return 
//		//   try
//		//   {
//		//     // Connect to the database.
//		//     pqxx::connection C;
//		//     std::cout << "Connected to " << C.dbname() << '\n';
//
//		//     // Start a transaction.
//		//     pqxx::nontransaction W{ C };
//
//		//     // Perform a query and retrieve all results.
//		//     pqxx::result R{ W.exec("select * from information_schema.tables where table_catalog = 'api' and table_schema = 'public'") };
//
//		//     // Iterate over results.
//		//     std::cout << "Found " << R.size() << "tables:\n";
//
//		//     std::cout << "OK.\n";
//		//   }
//		//   catch (std::exception const& e)
//		//   {
//		//     std::cerr << e.what() << '\n';
//		//     return 1;
//		//   }
//
//		   //	return a * b;
//	}
//}