use crate::errors::*;
use crate::io::tunnel::*;
use crate::io::*;
use crate::logger::*;
use crate::tunnel;
use crate::tunnel::TunnelDriver;
use crate::utils::*;

pub async fn handle_tunnel_message(message: &SSHTunnelMessagePayload) -> OutboundMessage {
  // Can we find the driver?
  let driver_result = tunnel::get_driver(&message.driver);
  if driver_result.is_none() {
    return OutboundMessage::Error(DriverError::UnknownDriver(DriverManagerUnknownType {
      unknown_from: "Tunnel Driver".into(),
      unknown_type: message.driver.clone(),
    }));
  }
  let driver = driver_result.unwrap();

  let get_instance_id = || {
    if message.id.is_none() {
      log(LogData::Error("Instance id not provided!".into()));
    }

    return message.id.unwrap_or(-1);
  };

  let message_data = &message.data;

  match message_data {
    SSHTunnelMessage::Create(connection_info) => {
      let result = driver.create(&connection_info).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(result.unwrap());
    }
    SSHTunnelMessage::TestAuth => {
      let result = driver.test_auth(&get_instance_id()).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(());
    }
    SSHTunnelMessage::Connect(port_forward) => {
      let result = driver.connect(&get_instance_id(), &port_forward).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(result.unwrap());
    }
    SSHTunnelMessage::Close => {
      let result = driver.close(&get_instance_id()).await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(());
    }
    SSHTunnelMessage::Flush => {
      let result = driver.flush().await;
      if result.is_err() {
        return OutboundMessage::Error(result.unwrap_err());
      }
      return as_result(());
    }
  }
}
