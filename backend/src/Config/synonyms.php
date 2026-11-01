<?php

declare(strict_types=1);

namespace Pepso\Config;

/**
 * Kamus sinonim istilah sparepart motor berbahasa Indonesia.
 * Format: 'kata_asli' => ['sinonim1', 'sinonim2', ...]
 * Mudah diperluas oleh admin teknis tanpa mengubah logika kode.
 */
return [
    // Mesin & Sistem Pembakaran
    'piston'     => ['seher', 'seker'],
    'seher'      => ['piston', 'seker'],
    'seker'      => ['piston', 'seher'],
    'silinder'   => ['blok', 'silnder'],
    'blok'       => ['silinder', 'mesin', 'block'],
    'karburator' => ['karbu', 'karburator', 'carbu', 'karbulator'],
    'karbu'      => ['karburator', 'carbu'],
    'knalpot'    => ['muffler', 'exhaust', 'knalpot', 'knlpot', 'silencer', 'kanlpot'],
    'muffler'    => ['knalpot', 'exhaust', 'silencer'],
    'klep'       => ['valve', 'klep', 'klap'],
    'valve'      => ['klep', 'katup'],
    'kips'       => ['super kips', 'kips valve', 'power valve'],
    'kopling'    => ['clutch', 'koppling', 'koping'],
    'clutch'     => ['kopling', 'koping'],
    'gear'       => ['gir', 'gigi', 'sproket'],
    'gir'        => ['gear', 'gigi', 'sproket', 'sprocket'],
    'sproket'    => ['sprocket', 'gir', 'gear', 'gigi'],
    'kruk as'    => ['crankshaft', 'poros engkol', 'krukus'],
    'crankshaft' => ['kruk as', 'poros engkol', 'krukus'],

    // Kelistrikan
    'cdi'        => ['pengapian', 'igniter', 'cdi box', 'kotak cdi'],
    'spul'       => ['stator', 'generator', 'pickup coil', 'spull'],
    'stator'     => ['spul', 'generator'],
    'kiprok'     => ['rectifier', 'regulator', 'kiprok voltage', 'kiprox'],
    'rectifier'  => ['kiprok', 'regulator'],
    'aki'        => ['baterai', 'accu', 'battery'],
    'accu'       => ['aki', 'baterai', 'battery'],
    'sein'       => ['lampu sein', 'lampu riting', 'turn signal', 'reting'],
    'stang'      => ['setang', 'handlebar', 'stir', 'kemudi'],
    'setang'     => ['stang', 'handlebar', 'stir'],

    // Bodi & Fairing
    'bodi'       => ['body', 'fairing', 'cover', 'bodie'],
    'fairing'    => ['bodi', 'body', 'cover', 'batok'],
    'batok'      => ['fairing', 'cover depan', 'shroud'],
    'spakbor'    => ['fender', 'spatbor', 'mud guard', 'mudguard'],
    'fender'     => ['spakbor', 'spatbor', 'mud guard'],
    'tangki'     => ['tanki', 'tank', 'fuel tank'],
    'tanki'      => ['tangki', 'tank', 'fuel tank'],
    'jok'        => ['sadel', 'seat', 'tempat duduk'],
    'sadel'      => ['jok', 'seat'],
    'knalpot'    => ['muffler', 'exhaust', 'silencer'],
    'cover'      => ['bodi', 'fairing', 'tutup'],

    // Kaki-kaki & Suspensi
    'shock'      => ['shockbreaker', 'suspensi', 'peredam', 'sok', 'sokbreker'],
    'sokbreker'  => ['shockbreaker', 'shock', 'suspensi'],
    'shockbreaker' => ['shock', 'sok', 'sokbreker', 'suspensi'],
    'velg'       => ['pelek', 'rim', 'roda'],
    'pelek'      => ['velg', 'rim', 'roda'],
    'ban'        => ['tire', 'tyre', 'karet ban'],
    'rem'        => ['brake', 'cakram', 'disc'],
    'cakram'     => ['disc', 'brake disc', 'rem cakram'],
    'disc'       => ['cakram', 'rem', 'brake disc'],
    'tromol'     => ['hub', 'drum', 'drum brake', 'tromol belakang'],
    'hub'        => ['tromol', 'drum'],
    'as'         => ['axle', 'poros', 'garpu'],
    'garpu'      => ['fork', 'suspensi depan', 'shockbreaker depan'],
    'fork'       => ['garpu', 'suspensi depan'],

    // Aksesori & Lainnya
    'behel'      => ['handle belakang', 'back handle', 'grip belakang'],
    'spion'      => ['kaca spion', 'mirror', 'cermin'],
    'mirror'     => ['spion', 'kaca spion'],
    'footstep'   => ['pijakan kaki', 'dek', 'injakan'],
    'dek'        => ['footstep', 'pijakan kaki'],
    'knob'       => ['grip', 'handle grip', 'pegangan'],
    'grip'       => ['knob', 'handle grip', 'pegangan stang'],

    // Tipe Motor (arti sama)
    'ninja r'    => ['kdr', 'ninja r 150', 'ninja 150 r'],
    'ninja rr'   => ['ninja rr 150', 'ninja 150 rr', 'zx150', 'new rr', 'old rr'],
    'ninja ss'   => ['ninja ss 150', 'ninja 150 ss'],
];

