use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use std::str;
use strum_macros::EnumString;

#[derive(strum_macros::Display, EnumString)]
pub enum TunnelDriverType {
  LIBSSH2,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SSHTunnelConfiguration {
  pub host: String,
  pub port: u16,
  pub username: String,
  #[serde(flatten)]
  pub authentication_method: SSHTunnelAuthenticationMethod,
}

#[derive(Serialize, Deserialize, Debug, Clone, strum_macros::Display, EnumString)]
#[serde(tag = "authenticationMethod")]
pub enum SSHTunnelAuthenticationMethod {
  Password(String),
  PublicKey {
    #[serde(rename = "privateKey")]
    private_key: String,
    passphrase: Option<String>,
  },
  Agent,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SSHTunnelPortForward {
  #[serde(rename = "remoteHost")]
  pub remote_host: String,
  #[serde(rename = "remotePort")]
  pub remote_port: u16,
  #[serde(rename = "localPort")]
  pub local_port: Option<u16>,
}
