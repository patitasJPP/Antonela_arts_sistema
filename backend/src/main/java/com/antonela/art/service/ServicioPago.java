package com.antonela.art.service;

import com.antonela.art.entity.*;
import com.antonela.art.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;


 // estaba trabajando en esto @patitas aun no esta definido compretamente
@Service
@RequiredArgsConstructor
public class ServicioPago {

  private final PagoRepository pagos;
  private final PoliticaCancelacionRepository politicasCancelacion;
}